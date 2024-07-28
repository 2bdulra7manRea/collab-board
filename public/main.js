import {
  storage,
  RESIZE_NAME_KEY,
  MOVE_NAME_KEY,
  playground,
  container,
  cardButton,
  IS_SOCKET_WORKING,
  EVENTS_SOCKET,
} from "./shared.js";


let isElementMoving = false;  // Flag to track if an element is currently being moved
let isElementResizing = false;  // Flag to track if an element is currently being resized
let randomCounterId = 10;  // Counter for generating unique IDs

const socket = io();  // Initialize socket.io client

// Class to handle socket communication
export class SocketServer {
  // Emit event to the server
  emit(eventName, data) {
    socket.emit(eventName, data);
  }

  // Listen for events from the server
  on(eventName, callback) {
    socket.on(eventName, callback);
  }
}

const socketServer = new SocketServer();  // Instantiate the SocketServer

// Emit input change event
function changeInputSocket(ev, textId) {
  const data = { textId, content: ev.target.value };
  socketServer.emit(EVENTS_SOCKET.ChangeInput, data);
}

// Emit element location change event
function changeLocationElementSocket(cardId, ev) {
  const data = { cardId, x: ev.x, y: ev.y };
  socketServer.emit(EVENTS_SOCKET.MovingCard, data);
}

// Emit element size change event
function changeSizeElementSocket(cardId, ev) {
  const data = { cardId, x: ev.x, y: ev.y };
  socketServer.emit(EVENTS_SOCKET.ResizingCard, data);
}

// Emit new card addition event
function userAddCardSocket(cardId, textId) {
  const data = { cardId, textId };
  socketServer.emit(EVENTS_SOCKET.AddingCard, data);
}

// Emit user pointer movement event
function addUserPointerSocket(ev, username) {
  const data = { username, x: ev.x, y: ev.y };
  socketServer.emit(EVENTS_SOCKET.MovingPointer, data);
}

// Prompt user to enter their username if not already stored in session storage
function enterUsername() {
  if (sessionStorage.getItem("username")) {
    return;
  }

  let username = "";
  while (!username) {
    username = prompt("Enter Your username ?");
  }

  sessionStorage.setItem("username", username);
}

// Get the current username from session storage
function getCurrentUsername() {
  return sessionStorage.getItem("username");
}

// Generate a unique ID
function generateId() {
  randomCounterId = randomCounterId + 13;
  return `${randomCounterId}Ml`;
}

// Stop updating the current element (moving or resizing)
function stopUpdateCurrentElement() {
  isElementMoving = false;
  isElementResizing = false;
  storage.set(MOVE_NAME_KEY, "");
  storage.set(RESIZE_NAME_KEY, "");
}

// Start moving an element
function startElementMoving(divId) {
  isElementMoving = true;
  storage.set(MOVE_NAME_KEY, divId);
}

// Start resizing an element
function startElementResizing(divId) {
  isElementResizing = true;
  storage.set(RESIZE_NAME_KEY, divId);
}

// Get the numeric value from a CSS style property
function getOriginNumber(st, type) {
  return +st[type].substring(0, st[type].length - 2);
}

// Handle resizing the current element
function handleResizingCurrentElement(currentId, event) {
  const elem = document.getElementById(currentId);
  const style = window.getComputedStyle(elem);
  let top = getOriginNumber(style, "top");
  let h = getOriginNumber(style, "height");
  let w = getOriginNumber(style, "width");
  let left = getOriginNumber(style, "left");
  elem.style.height = h - (h + top - event.y) + "px";
  elem.style.width = w - (w + left - event.x) + "px";
}

// Handle moving the current element
function handleMovingCurrentElement(currentId, event) {
  const elem = document.getElementById(currentId);
  const style = window.getComputedStyle(elem);
  elem.style.top = event.y + 25 + "px";
  elem.style.left = -getOriginNumber(style, "width") + event.x + 45 + "px";
}

// Handle mouse movement on the page
function mouseMoveOnPage(event) {
  // Emit pointer movement if socket is working
  if (IS_SOCKET_WORKING) {
    addUserPointerSocket(event, getCurrentUsername());
  }

  // Update element location if it is being moved
  if (isElementMoving && storage.has(MOVE_NAME_KEY)) {
    let currentId = storage.get(MOVE_NAME_KEY);
    handleMovingCurrentElement(currentId, event);
    changeLocationElementSocket(currentId, event);
  }

  // Update element size if it is being resized
  if (isElementResizing && storage.has(RESIZE_NAME_KEY)) {
    let currentId = storage.get(RESIZE_NAME_KEY);
    handleResizingCurrentElement(currentId, event);
    changeSizeElementSocket(currentId, event);
  }
}

// Create a new element with an optional class name
function createElement(tagName, className = null) {
  const div = document.createElement(tagName);
  if (className) {
    div.setAttribute("class", className);
  }

  const id = generateId();
  div.setAttribute("id", id);
  return [div, id];
}

// Add a text card element for remote user
function addTextCardRemote(cardId, textId) {
  if (!document.getElementById(cardId)) {
    const [card] = createElement("div", "card-text");
    card.setAttribute("id", cardId);
    const [text] = createElement("textArea", "card-text-input");
    text.setAttribute("id", textId);
    text.setAttribute("disabled", true);
    card.append(text);
    playground.append(card);
  }
}

// Add a text card element for the host user
function addTextCardHost() {
  const [card, id] = createElement("div", "card-text");

  const [iconMove] = createElement("div", "card-move-icon");

  const [text, textId] = createElement("textArea", "card-text-input");
  text.addEventListener("input", (ev) => changeInputSocket(ev, textId));

  const [resizeDiv] = createElement("div", "card-resize-icon");

  iconMove.addEventListener("mousedown", () => startElementMoving(id));
  resizeDiv.addEventListener("mousedown", () => startElementResizing(id));

  card.append(text);
  card.append(iconMove);
  card.append(resizeDiv);
  playground.append(card);

  userAddCardSocket(id, textId);
}

// Update the content of a text card
function updateInputCard(textId, content) {
  document.getElementById(textId).textContent = content;
}

// Update the user pointer position for remote users
function updateUserPointerRemote(x, y, username) {
  if (!document.getElementById(username)) {
    const [div] = createElement("div", "user-pointer");
    div.textContent = username;
    div.setAttribute("id", username);
    div.style.top = y;
    div.style.left = x;
    playground.append(div);
  } else {
    handleMovingCurrentElement(username, { x, y });
  }
}

// Handle receiving new card addition from socket
function receiveAddingCardRemote(data) {
  const { cardId, textId } = data;
  addTextCardRemote(cardId, textId);
}

// Handle receiving card movement from socket
function receiveMovingCardRemote(data) {
  const { cardId, y, x } = data;
  handleMovingCurrentElement(cardId, { y, x });
}

// Handle receiving card resizing from socket
function receiveResizingCardRemote(data) {
  const { cardId, x, y } = data;
  handleResizingCurrentElement(cardId, { x, y });
}

// Handle receiving pointer movement from socket
function receiveMovingPointerRemote(data) {
  const { x, y, username } = data;
  updateUserPointerRemote(x, y, username);
}

// Handle receiving input change from socket
function receiveChangeInputRemote(data) {
  const { textId, content } = data;
  updateInputCard(textId, content);
}

// Listen for socket events
socketServer.on(EVENTS_SOCKET.MovingCard, receiveMovingCardRemote);
socketServer.on(EVENTS_SOCKET.ResizingCard, receiveResizingCardRemote);
socketServer.on(EVENTS_SOCKET.MovingPointer, receiveMovingPointerRemote);
socketServer.on(EVENTS_SOCKET.ChangeInput, receiveChangeInputRemote);
socketServer.on(EVENTS_SOCKET.AddingCard, receiveAddingCardRemote);

// Add event listeners for user interactions
container.addEventListener("mouseup", stopUpdateCurrentElement);
container.addEventListener("mousemove", mouseMoveOnPage);
cardButton.addEventListener("click", addTextCardHost);
enterUsername();
