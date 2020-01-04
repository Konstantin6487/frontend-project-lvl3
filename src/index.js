import '../scss/app.scss';

const div = document.createElement('div');
div.innerHTML = `<main role="main">
<div class="jumbotron jumbotron-fluid">
  <div class="container">
    <h1>Navbar example</h1>
    <p class="lead">This example is a quick exercise to illustrate how the top-aligned navbar works. As you scroll, this navbar remains in its original position and moves with the rest of the page.</p>
    <a class="btn btn-lg btn-primary" href="#" role="button">View navbar docs »</a>
  </div>
  </div>
</main>`;
document.body.appendChild(div);
