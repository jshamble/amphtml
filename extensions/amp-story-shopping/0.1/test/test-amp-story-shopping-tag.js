import {createElementWithAttributes} from '#core/dom';
import {Layout_Enum} from '#core/dom/layout';

import '../amp-story-shopping';
import {Services} from '#service';
import {LocalizationService} from '#service/localization';

import {registerServiceBuilder} from '../../../../src/service-helpers';
import {
  Action,
  StateProperty,
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
    let localizationService;
    let attachmentElement;
    let pageEl;

    beforeEach(async () => {
      win = env.win;
      storeService = getStoreService(win);
      registerServiceBuilder(win, 'story-store', function () {
        return storeService;
      });

      storeService.dispatch(Action.SET_PAGE_SIZE, {width: 1000, height: 1000});

      localizationService = new LocalizationService(win.document.body);
      env.sandbox
        .stub(Services, 'localizationServiceForOrNull')
        .returns(Promise.resolve(localizationService));

      await createAmpStoryShoppingTag();
    });

    async function createAmpStoryShoppingTag() {
      pageEl = win.document.createElement('amp-story-page');
      pageEl.id = 'page1';
      element = createElementWithAttributes(
        win.document,
        'amp-story-shopping-tag',
        {'layout': 'container'}
      );
      pageEl.appendChild(element);

      attachmentElement = win.document.createElement(
        'amp-story-shopping-attachment'
      );
      const story = win.document.createElement('amp-story');
      win.document.body.appendChild(story);
      story.appendChild(pageEl);
      pageEl.appendChild(attachmentElement);
      win.document.body.appendChild(pageEl);
      shoppingTag = await element.getImpl();
    }

    async function shoppingDataDispatchStoreService() {
      const shoppingData = {
        'sunglasses': {'productTitle': 'Spectacular Spectacles'},
      };
      storeService.dispatch(Action.ADD_SHOPPING_DATA, shoppingData);
    }

    it('should build and layout shopping tag component', () => {
      expect(() => shoppingTag.layoutCallback()).to.not.throw();
    });

    it('should not build shopping tag if page attachment is removed', () => {
      pageEl.removeChild(attachmentElement);

      shoppingTag.buildCallback();
      shoppingTag.layoutCallback();

      expect(shoppingTag.element.textContent).to.be.empty;
    });

    it('should process config data and set text container content if data not null', async () => {
      shoppingTag.element.setAttribute('data-product-id', 'sunglasses');
      await shoppingDataDispatchStoreService();
      env.sandbox.stub(shoppingTag, 'measureMutateElement').callsFake(() => {
        expect(shoppingTag.element.textContent).to.equal(
          'Spectacular Spectacles'
        );
      });
    });

    it('should not process config data and set text container content if id not found', async () => {
      shoppingTag.element.setAttribute('data-product-id', 'hat');
      await shoppingDataDispatchStoreService();
      expect(shoppingTag.element.textContent).to.be.empty;
      expect(shoppingTag.isLayoutSupported(Layout_Enum.CONTAINER)).to.be.true;
    });

    it('should set active product in store service when shopping tag is clicked', async () => {
      const tagData = {
        'productId': 'sunglasses',
        'productTitle': 'Spectacular Spectacles',
        'productPrice': '400',
        'productIcon':
          '/examples/visual-tests/amp-story/img/shopping/nest-audio-icon.png',
      };

      await shoppingTag.element.click();

      env.sandbox.stub(shoppingTag, 'mutateElement').callsFake(() => {
        expect(
          storeService.get(StateProperty.SHOPPING_DATA['activeProductData'])
        ).to.deep.equal(tagData);
      });
    });
  }
);
