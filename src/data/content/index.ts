import type { ChapterContent } from './types';
import { CH1 } from './ch1';
import { CH2 } from './ch2';
import { CH3 } from './ch3';
import { CH4 } from './ch4';
import { CH5 } from './ch5';

/** Every content module, in chapter order. A module that defines `chapter` + `map` adds a whole chapter; the others extend one. */
export const CONTENT: readonly ChapterContent[] = [CH1, CH2, CH3, CH4, CH5];
