class FormValidator {
  constructor() {
    this._validity = new Map();
    this._enablees = [];
  }

  enableWhenAllValid(node) {
    this._enablees.push(node);
  }

  add(subject) {
    // subject: {form: node, validity: fn, msg: string}
    subject.form.parentNode.nextElementSibling.innerHTML = subject.msg || "";
    this._validity.set(subject.form.id, true);
    this._addEventListener(subject);
  }

  allValid() {
    for (let validity of this._validity.values()) {
      if (validity === false) {
        return false;
      }
    }
    return true;
  }

  resetInvalidForms() {
    if (this.allValid()) {
      return;
    }

    for (let [form, validity] of this._validity) {
      if (validity === false) {
        let field = document.getElementById(form);
        field.value = field.defaultValue;
        this._validation(true, field);
      }
    }
  }

  _addEventListener(subject) {
    subject.form.addEventListener("input", () => {
      this._validation(subject.validity(subject.form.value), subject.form);
    });
  }

  _validation(isValid, form) {
    let parent = form.parentNode;
    if (isValid) {
      parent.parentNode.classList.remove("has-danger");
      parent.nextElementSibling.classList.add("hidden");
      this._validity.set(form.id, true);
      this._unlock();
    } else {
      parent.parentNode.classList.add("has-danger");
      parent.nextElementSibling.classList.remove("hidden");
      this._validity.set(form.id, false);
      this._lock();
    }
  }

  _unlock() {
    if (this.allValid()) {
      this._enablees.forEach(node => node.removeAttribute("disabled"));
    }
  }

  _lock() {
    this._enablees.forEach(node => node.setAttribute("disabled", "true"));
  }
}

export default FormValidator;
