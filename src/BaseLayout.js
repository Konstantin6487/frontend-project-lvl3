export default class BaseLayout {
  constructor(element) {
    this.element = element;
  }

  template = `
    <div class="container-fluid">
      <div class="row">
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary w-100">
          <a class="navbar-brand" href="https://github.com/Konstantin6487/frontend-project-lvl3">
            GitHub
          </a>
        </nav>
      </div>
      <div class="row">
        <div class="col-sm-2 px-0 bg-dark min-vh-100">
          <div class="sticky-top pt-1">
            <span class="pl-3 font-weight-bold text-muted font-italic border-0">Channels</span>
            <ul class="nav nav-tabs flex-sm-column border-0"></ul>
          </div>
        </div>
        <main class="col p-0" role="main">
          <div class="jumbotron jumbotron-fluid mb-3">
            <div class="container">
              <h1>RSS Preview</h1>
              <p class="lead">A simple online RSS reader.<br />Enter the URL of the RSS feed, click sync, and preview the results.</p>
              <form>
                <label for="feedUrl"><b>Link</b></label>
                <div class="input-group">
                  <input type="text" name="feed-url" class="form-control form-control-lg border-right-0 border-info" id="feedUrl" placeholder="RSS Feed URL" aria-describedby="emailHelp">
                  <div class="input-group-append">
                    <button class="btn btn-primary" type="submit" id="button-submit">Sync</button>
                  </div>
                  <div class="feedback"></div>
                </div>
              </form>
            </div>
          </div>
          <section class="container">
            <ul class="list-group"></ul>
          </section>
        </main>
      </div>
    </div>`;

  init() {
    this.element.innerHTML = this.template;
  }
}
