import { parsePage } from '../sites';
import japaneseasmrList1Html from './japaneseasmr-list1.html?raw';
import japaneseasmrList1Expected from './japaneseasmr-list1.json';

interface ParserTestCase {
    html: string;
    url: string;
    // 每个用例的预期记录数组；可以省略 updateCount 和 updateDate。
    expected: unknown[];
}

// 在这里登记测试用例，HTML 和预期 JSON 分别从外部文件引入。
const parserTestCases: ParserTestCase[] = [
    {
        url: 'https://japaneseasmr.com',
        html: japaneseasmrList1Html,
        expected: japaneseasmrList1Expected,
    },
];

interface Difference {
    path: string;
    actual: unknown;
    expected: unknown;
}

interface RecordFailure {
    index: number;
    actual: unknown;
    expected: unknown;
    differences: Difference[];
}

interface CaseResult {
    url: string;
    passed: boolean;
    actual: unknown[] | undefined;
    expected: unknown[];
    failures: RecordFailure[];
    error?: string;
}

export interface ContentTestReport {
    total: number;
    passed: number;
    failed: number;
    results: CaseResult[];
}

const ignoredFields = new Set(['updateCount', 'updateDate']);

function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compareValues(actual: unknown, expected: unknown, path: string): Difference[] {
    if (Object.is(actual, expected)) return [];

    if (Array.isArray(actual) && Array.isArray(expected)) {
        const differences: Difference[] = [];
        for (let index = 0; index < Math.max(actual.length, expected.length); index++) {
            const itemPath = `${path}[${index}]`;
            if (index >= actual.length || index >= expected.length) {
                differences.push({ path: itemPath, actual: actual[index], expected: expected[index] });
            } else {
                differences.push(...compareValues(actual[index], expected[index], itemPath));
            }
        }
        return differences;
    }

    if (isObject(actual) && isObject(expected)) {
        const differences: Difference[] = [];
        const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
        for (const key of keys) {
            if (ignoredFields.has(key)) continue;
            const fieldPath = `${path}.${key}`;
            if (!Object.hasOwn(actual, key) || !Object.hasOwn(expected, key)) {
                differences.push({ path: fieldPath, actual: actual[key], expected: expected[key] });
            } else {
                differences.push(...compareValues(actual[key], expected[key], fieldPath));
            }
        }
        return differences;
    }

    return [{ path, actual, expected }];
}

function compareRecords(actual: readonly unknown[], expected: readonly unknown[]): RecordFailure[] {
    const failures: RecordFailure[] = [];
    for (let index = 0; index < Math.max(actual.length, expected.length); index++) {
        const path = `$[${index}]`;
        const differences = index >= actual.length || index >= expected.length
            ? [{ path, actual: actual[index], expected: expected[index] }]
            : compareValues(actual[index], expected[index], path);
        if (differences.length > 0) {
            failures.push({ index, actual: actual[index], expected: expected[index], differences });
        }
    }
    return failures;
}

export function contentTest(): ContentTestReport {
    const results = parserTestCases.map((testCase): CaseResult => {
        const result: CaseResult = {
            url: testCase.url,
            passed: false,
            actual: undefined,
            expected: testCase.expected,
            failures: [],
        };

        try {
            if (!Array.isArray(testCase.expected)) {
                throw new Error('expected 必须是预期记录的 JSON 数组。');
            }
            const doc = new DOMParser().parseFromString(testCase.html, 'text/html');
            result.actual = parsePage(doc, testCase.url);
            if (result.actual === undefined) {
                throw new Error('解析器未返回记录数组，该 HTML 可能被识别为详情页。');
            }
            result.failures = compareRecords(result.actual, testCase.expected);
            result.passed = result.failures.length === 0;
        } catch (error) {
            result.error = error instanceof Error ? error.message : String(error);
        }
        return result;
    });

    const passed = results.filter((result) => result.passed).length;
    const report = { total: results.length, passed, failed: results.length - passed, results };

    for (const result of results) {
        if (result.passed) continue;
        console.group(`❌ ${result.url}`);
        if (result.error) console.error(result.error);
        for (const failure of result.failures) {
            console.group(`未通过的记录 #${failure.index + 1}`);
            console.log('实际记录', failure.actual);
            console.log('预期记录', failure.expected);
            console.table(failure.differences);
            console.groupEnd();
        }
        console.groupEnd();
    }
    console.info(`[解析测试] 共 ${report.total} 个用例，通过 ${report.passed}，失败 ${report.failed}。`);
    return report;
}

declare global {
    interface Window {
        test: typeof contentTest;
    }
}
