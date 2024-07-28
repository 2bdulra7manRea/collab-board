export const storage = new Map();
export const RESIZE_NAME_KEY = "resize";
export const MOVE_NAME_KEY = "current";
export const playground = document.getElementById("playground");
export const container = document.getElementById("cont");
export const cardButton = document.getElementById("card-button");
export let isElementMoving = false;
export let isElementResizing = false;
export let randomCounterId = 10;
export const IS_SOCKET_WORKING = true;

export const EVENTS_SOCKET = {
  MovingCard: "MovingCard",
  ResizingCard: "ResizingCard",
  MovingPointer: "MovingPointer",
  ChangeInput: "ChangeInput",
  AddingCard: "AddingCard",
};
