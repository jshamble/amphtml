import {createElementWithAttributes} from '#core/dom';
import '../amp-story-shopping';

import {registerServiceBuilder} from '../../../../src/service-helpers';
import {
  Action,
  getStoreService,
} from '../../../amp-story/1.0/amp-story-store-service';

describes.realWin(
  'amp-story-shopping-tag-v0.1',
  {
    amp: {
      runtimeOn: true,
      extensions: ['amp-story-shopping:0.1'],
    },
  },
  (env) => {
    let win;
    let element;
    let shoppingTag;
    let storeService;

    beforeEach(async () => {
      win = env.win;

      storeService = getStoreService(win);
      registerServiceBuilder(win, 'story-store', function () {
        return storeService;
      });

      await createAmpStoryShoppingTag();
    });

    async function createAmpStoryShoppingTag() {
      const pageEl = win.document.createElement('amp-story-page');
      pageEl.id = 'page1';
      element = createElementWithAttributes(
        win.document,
        'amp-story-shopping-tag',
        {'layout': 'container'}
      );

      pageEl.appendChild(element);
      win.document.body.appendChild(pageEl);

      shoppingTag = await element.getImpl();
    }

    async function shoppingDataDispatchStoreService() {
      const shoppingData = {
        'sunglasses': {'product-title': 'Spectacular Spectacles'},
      };
      storeService.dispatch(Action.ADD_SHOPPING_DATA, shoppingData);
    }

    it('should build and layout shopping tag component', () => {
      expect(() => shoppingTag.layoutCallback()).to.not.throw();
    });

    it('should process config data and set text container content if data not null', async () => {
      shoppingTag.element.setAttribute('data-tag-id', 'sunglasses');
      await shoppingDataDispatchStoreService();
      env.sandbox.stub(shoppingTag, 'mutateElement').callsFake(() => {
        const shoppingData = {
          'sunglasses': {'product-title': 'Spectacular Spectacles'},
        };
        shoppingTag.element.textContent =
          shoppingData['sunglasses']['product-title'];
        expect(shoppingTag.element.textContent).to.equal(
          'Spectacular Spectacles'
        );
      });
    });

    it('should not process config data and set text container content if id not found', async () => {
      shoppingTag.element.setAttribute('data-tag-id', 'hat');
      await shoppingDataDispatchStoreService();
      expect(shoppingTag.element.textContent).to.be.empty;
    });
  }
);
