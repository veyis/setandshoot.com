import { DiptychBlock } from "./diptych";
import { FullBleedPhotoBlock } from "./full-bleed-photo";
import { InsetPortraitBlock } from "./inset-portrait";
import { PullQuoteBlock } from "./pull-quote";
import { SequenceBlock } from "./sequence";
import { TextParagraphBlock } from "./text-paragraph";
import { TriptychBlock } from "./triptych";

export const storyLayoutBlocks = [
  FullBleedPhotoBlock,
  DiptychBlock,
  TriptychBlock,
  InsetPortraitBlock,
  SequenceBlock,
  PullQuoteBlock,
  TextParagraphBlock,
];
