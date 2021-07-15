/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Services} from '#service';
import {StoryAdConfig} from '../story-ad-config';
import {createStoryAdElementAndConfig} from './story-mock';

describes.realWin(
  'amp-story-auto-ads:config',
  {
    amp: true,
  },
  (env) => {
    let win;
    let doc;

    beforeEach(() => {
      win = env.win;
      doc = win.document;
    });

    describe('story ad config', () => {
      it('handles valid doubleclick config', async () => {
        const config = {
          type: 'doubleclick',
          'data-slot': '/30497360/a4a/amp_story_dfp_example',
        };
        const storyAdEl = createStoryAdElementAndConfig(
          doc,
          doc.body, // Parent.
          config
        );
        const result = await new StoryAdConfig(storyAdEl, win).getConfig();

        expect(result).to.eql({
          'amp-story': '',
          class: 'i-amphtml-story-ad',
          'data-slot': '/30497360/a4a/amp_story_dfp_example',
          layout: 'fill',
          type: 'doubleclick',
        });
      });

      it('handles valid adsense config', async () => {
        const config = {
          type: 'adsense',
          'data-ad-client': 'ca-pub-8588820008944775',
        };
        const storyAdEl = createStoryAdElementAndConfig(
          doc,
          doc.body, // Parent.
          config
        );
        const result = await new StoryAdConfig(storyAdEl, win).getConfig();
        expect(result).to.eql({
          'amp-story': '',
          class: 'i-amphtml-story-ad',
          layout: 'fill',
          'data-ad-client': 'ca-pub-8588820008944775',
          type: 'adsense',
        });
      });

      it('stringifies additional attributes passed in as objects', async () => {
        const config = {
          type: 'doubleclick',
          'data-slot': '/30497360/a4a/amp_story_dfp_example',
          'rtc-config': {
            vendors: {
              vendor1: {
                'SLOT_ID': 1,
              },
              vendor2: {
                'PAGE_ID': 'abc',
              },
            },
          },
        };
        const storyAdEl = createStoryAdElementAndConfig(
          doc,
          doc.body, // Parent.
          config
        );
        const result = await new StoryAdConfig(storyAdEl, win).getConfig();
        expect(result['rtc-config']).to.equal(
          '{"vendors":{"vendor1":{"SLOT_ID":1},"vendor2":{"PAGE_ID":"abc"}}}'
        );
      });

      it('throws on no config', () => {
        const storyAdEl = doc.createElement('amp-story-auto-ads');
        doc.body.appendChild(storyAdEl);
        allowConsoleError(() => {
          expect(() => {
            new StoryAdConfig(storyAdEl, win).getConfig();
          }).to.throw(
            /The amp-story-auto-ads:config should be inside a <script> tag with type=\"application\/json\"​​​/
          );
        });
      });

      it('throws on missing ad-attributes', async () => {
        const storyAdEl = doc.createElement('amp-story-auto-ads');
        storyAdEl.innerHTML = `
        <script type="application/json">
          { "type": "doubleclick" }
        </script>
      `;
        doc.body.appendChild(storyAdEl);
        expectAsyncConsoleError(async () => {
          expect(async () => {
            await new StoryAdConfig(storyAdEl, win).getConfig();
          }).to.throw(
            /amp-story-auto-ads:config Error reading config\. Top level JSON should have an \"ad-attributes\" key​​​/
          );
        });
      });

      it('sanitizes unallowed attributes', async () => {
        const config = {
          type: 'doubleclick',
          'data-slot': '/30497360/a4a/amp_story_dfp_example',
          height: '1000px', // Should scrub.
          width: '1000px', // Should scrub.
          layout: 'intrinsic', // Should overwrite to fill.
        };
        const storyAdEl = createStoryAdElementAndConfig(
          doc,
          doc.body, // Parent.
          config
        );
        const result = await new StoryAdConfig(storyAdEl, win).getConfig();
        expect(result).to.eql({
          'amp-story': '',
          class: 'i-amphtml-story-ad',
          'data-slot': '/30497360/a4a/amp_story_dfp_example',
          layout: 'fill',
          type: 'doubleclick',
        });
      });

      it('throws on invalid ad type', async () => {
        const config = {
          type: 'unsupported',
          'data-slot': '/30497360/a4a/amp_story_dfp_example',
        };
        const storyAdEl = createStoryAdElementAndConfig(
          doc,
          doc.body, // Parent.
          config
        );
        expectAsyncConsoleError(async () => {
          expect(async () => {
            await new StoryAdConfig(storyAdEl, win).getConfig();
          }).to.throw(
            /amp-story-auto-ads:config \"unsupported\" ad type is missing or not supported/
          );
        });
      });

      it('throws when using fake ad without making doc invalid', async () => {
        const config = {
          type: 'fake',
          'src': '/examples/amp-story/ads/app-install.html',
          'a4a-conversion': true,
        };
        const storyAdEl = createStoryAdElementAndConfig(
          doc,
          doc.body, // Parent.
          config
        );
        expectAsyncConsoleError(async () => {
          expect(async () => {
            await new StoryAdConfig(storyAdEl, win).getConfig();
          }).to.throw(
            /amp-story-auto-ads:config id must start with i-amphtml-demo- to use fake ads/
          );
        });
      });

      it('works when using fake ad while making doc invalid', async () => {
        const config = {
          type: 'fake',
          'src': '/examples/amp-story/ads/app-install.html',
          'a4a-conversion': true,
        };
        const storyAdEl = createStoryAdElementAndConfig(
          doc,
          doc.body, // Parent.
          config
        );
        storyAdEl.id = 'i-amphtml-demo-foo';

        const result = await new StoryAdConfig(storyAdEl, win).getConfig();
        expect(result).to.eql({
          type: 'fake',
          src: '/examples/amp-story/ads/app-install.html',
          'a4a-conversion': true,
          class: 'i-amphtml-story-ad',
          layout: 'fill',
          'amp-story': '',
        });
      });
    });

    it('does use remote config when src attribute is provided', async () => {
      const config = {
        type: 'doubleclick',
        'data-slot': '/30497360/a4a/amp_story_dfp_example',
      };
      const exampleURL = 'foo.example';
      const xhrService = Services.xhrFor(win);
      const fetchStub = env.sandbox.stub(xhrService, 'fetchJson').resolves({
        json: () => Promise.resolve({'ad-attributes': config}),
      });

      const storyAutoAdsElem = doc.createElement('amp-story-auto-ads');
      storyAutoAdsElem.setAttribute('src', exampleURL);

      const result = await new StoryAdConfig(storyAutoAdsElem, win).getConfig();
      expect(fetchStub).to.be.calledWith(exampleURL);
      expect(result).to.eql({
        'amp-story': '',
        class: 'i-amphtml-story-ad',
        'data-slot': '/30497360/a4a/amp_story_dfp_example',
        layout: 'fill',
        type: 'doubleclick',
      });
    });

    it('uses inline config when src attribute is not provided', async () => {
      const config = {
        type: 'doubleclick',
        'data-slot': '/30497360/a4a/amp_story_dfp_example',
      };

      const storyAutoAdsElem = createStoryAdElementAndConfig(
        doc,
        doc.body, // Parent.
        config
      );

      const result = await new StoryAdConfig(storyAutoAdsElem, win).getConfig();
      expect(result).to.eql({
        'amp-story': '',
        class: 'i-amphtml-story-ad',
        'data-slot': '/30497360/a4a/amp_story_dfp_example',
        layout: 'fill',
        type: 'doubleclick',
      });
    });
  }
);
