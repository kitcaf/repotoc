import { describe, it, expect } from 'vitest';
import { scanTags } from '../src/injector/scanner.js';

describe('Injector Scanner', () => {
    describe('TOC_Mark Recognition', () => {
        it('should recognize standard <!--toc--> mark', () => {
            const lines = ['# Title', '<!--toc-->', 'content'];
            const { tocMarks } = scanTags(lines);

            expect(tocMarks).toHaveLength(1);
            expect(tocMarks[0].lineIndex).toBe(1);
            expect(tocMarks[0].originalText).toBe('<!--toc-->');
        });

        it('should recognize mark with spaces <!-- toc -->', () => {
            const lines = ['<!-- toc -->', 'content'];
            const { tocMarks } = scanTags(lines);

            expect(tocMarks).toHaveLength(1);
            expect(tocMarks[0].originalText).toBe('<!-- toc -->');
        });

        it('should recognize uppercase <!--TOC-->', () => {
            const lines = ['<!--TOC-->', 'content'];
            const { tocMarks } = scanTags(lines);

            expect(tocMarks).toHaveLength(1);
        });

        it('should recognize mixed case <!-- TOC -->', () => {
            const lines = ['<!-- TOC -->', 'content'];
            const { tocMarks } = scanTags(lines);

            expect(tocMarks).toHaveLength(1);
        });

        it('should find multiple marks', () => {
            const lines = ['<!--toc-->', 'content', '<!--toc-->'];
            const { tocMarks } = scanTags(lines);

            expect(tocMarks).toHaveLength(2);
            expect(tocMarks[0].lineIndex).toBe(0);
            expect(tocMarks[1].lineIndex).toBe(2);
        });
    });

    describe('TOC_End Recognition', () => {
        it('should recognize end tag without offset', () => {
            const lines = ['<!--tocEnd-->'];
            const { tocEnds } = scanTags(lines);

            expect(tocEnds).toHaveLength(1);
            expect(tocEnds[0].offset).toBe(0);
        });

        it('should recognize end tag with offset', () => {
            const lines = ['<!--tocEnd:offset=5-->'];
            const { tocEnds } = scanTags(lines);

            expect(tocEnds).toHaveLength(1);
            expect(tocEnds[0].offset).toBe(5);
        });

        it('should recognize end tag with spaces', () => {
            const lines = ['<!-- tocEnd:offset=3 -->'];
            const { tocEnds } = scanTags(lines);

            expect(tocEnds).toHaveLength(1);
            expect(tocEnds[0].offset).toBe(3);
        });
    });

    describe('Code Block Ignore', () => {
        it('should ignore marks inside code blocks', () => {
            const lines = [
                '```markdown',
                '<!--toc-->',
                '```',
                'content'
            ];
            const { tocMarks } = scanTags(lines);

            expect(tocMarks).toHaveLength(0);
        });

        it('should ignore marks inside tilde code blocks', () => {
            const lines = [
                '~~~',
                '<!--toc-->',
                '~~~',
                'content'
            ];
            const { tocMarks } = scanTags(lines);

            expect(tocMarks).toHaveLength(0);
        });

        it('should recognize marks outside code blocks', () => {
            const lines = [
                '```',
                'code',
                '```',
                '<!--toc-->',
                'content'
            ];
            const { tocMarks } = scanTags(lines);

            expect(tocMarks).toHaveLength(1);
            expect(tocMarks[0].lineIndex).toBe(3);
        });

        it('should treat unclosed code block as containing all following content', () => {
            const lines = [
                '```',
                '<!--toc-->',
                'more content'
            ];
            const { tocMarks } = scanTags(lines);

            expect(tocMarks).toHaveLength(0);
        });
    });

    describe('Complete Scan', () => {
        it('should scan both marks and ends', () => {
            const lines = [
                '# Title',
                '<!--toc-->',
                '- item 1',
                '- item 2',
                '<!--tocEnd:offset=2-->',
                'footer'
            ];
            const { tocMarks, tocEnds } = scanTags(lines);

            expect(tocMarks).toHaveLength(1);
            expect(tocEnds).toHaveLength(1);
            expect(tocMarks[0].lineIndex).toBe(1);
            expect(tocEnds[0].lineIndex).toBe(4);
            expect(tocEnds[0].offset).toBe(2);
        });
    });
});
