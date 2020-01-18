export default class {
  constructor(element) {
    this.element = element;
  }

  init(template) {
    this.element.innerHTML = template;
  }
}
