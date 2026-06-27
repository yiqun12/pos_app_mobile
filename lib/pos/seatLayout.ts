import type { RawSeatLayout } from "@/lib/firestore/raw-types";
import type { Seat, SeatLayout } from "@/lib/firestore/types";

/** Matches eatifyPos seat.html grid (30px cells, 15px snap). */
export const SEAT_GRID_SIZE = 30;
export const SEAT_GRID_SNAP = SEAT_GRID_SIZE / 2;
export const SEAT_CANVAS_BACKGROUND = "#f8f8f8";
export const SEAT_GRID_LINE_COLOR = "#ebebeb";

export function snapToSeatGrid(value: number): number {
  "worklet";
  return Math.round(value / SEAT_GRID_SNAP) * SEAT_GRID_SNAP;
}

export function snapSeatPosition(x: number, y: number): { x: number; y: number } {
  return {
    x: snapToSeatGrid(x),
    y: snapToSeatGrid(y),
  };
}

export function getSeatCanvasSize(viewportWidth: number, viewportHeight: number): {
  width: number;
  height: number;
} {
  return {
    width: Math.max(viewportWidth * 3, 1800),
    height: Math.max(viewportHeight * 3, 1800),
  };
}

export function generateSeatId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function serializeSeatLayout(layout: SeatLayout): RawSeatLayout {
  return {
    table: layout.tables.map((seat) => {
      const base = {
        id: seat.id,
        tableName: seat.name,
        left: Math.round(seat.x),
        top: Math.round(seat.y),
        scaleX: 1,
        scaleY: 1,
        snapAngle: 45,
        angle: 0,
      };

      if (seat.type === "circle") {
        return {
          ...base,
          type: "circle" as const,
          radius: seat.radius ?? 30,
        };
      }

      return {
        ...base,
        type: "rect" as const,
        width: seat.width,
        height: seat.height,
      };
    }),
    chair: [],
    wall: [],
  };
}

export function stripSeatForEditing(seat: Seat): Seat {
  const { status: _status, itemCount: _itemCount, ...rest } = seat;
  return { ...rest };
}

export function defaultPlacement(index: number): { x: number; y: number } {
  const rawX = 30 + (index % 5) * 70;
  const rawY = 30 + Math.floor(index / 5) * 70;
  return snapSeatPosition(rawX, rawY);
}
