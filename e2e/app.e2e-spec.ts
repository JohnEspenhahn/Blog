import { JespPage } from './app.po';

describe('jesp App', () => {
  let page: JespPage;

  beforeEach(() => {
    page = new JespPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
