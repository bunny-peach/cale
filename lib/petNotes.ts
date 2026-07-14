// Handwritten sticky notes stuck by the pets' nest. Two directions:
//   toCale  — notes Quinn leaves for Cale (written on the rabbit / Cale side)
//   toQuinn — notes Cale leaves for Quinn (appear on the wolf side)

export interface PetNote {
  id: string;
  text: string;
  at: number;
}

export interface PetNotes {
  toCale: PetNote[];
  toQuinn: PetNote[];
}

export const emptyNotes = (): PetNotes => ({ toCale: [], toQuinn: [] });

// Rotating pastel paper colours for the sticky notes.
export const NOTE_COLORS = ["#fef3c7", "#fde4ec", "#e6f2dd", "#e2ecfb", "#f3e8fd"];
export function noteColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return NOTE_COLORS[h % NOTE_COLORS.length];
}
