import '../scss/app.scss';

export default () => {
  const div = document.createElement('div');
  div.innerHTML = `<main role="main">
  <div class="jumbotron jumbotron-fluid">
    <div class="container">
      <h1>Form example</h1>
      <p class="lead">This example is a quick exercise to illustrate how the top-aligned navbar works. As you scroll, this navbar remains in its original position and moves with the rest of the page.</p>
      <form>
        <label for="input1">Поле ввода</label>
        <div class="input-group">
          <input type="text" class="form-control form-control-lg" id="input1" aria-describedby="emailHelp">
          <div class="input-group-append">
            <button class="btn btn-primary" type="submit" id="button-submit">Кнопка</button>
          </div>
        </div>
      </form>
    </div>
    </div>
  </main>`;
  document.body.appendChild(div);
};
