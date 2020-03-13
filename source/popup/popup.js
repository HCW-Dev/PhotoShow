/**
 * Copyright (c) 2012-2020 Vincent W., MIT-licensed.
 * @fileOverview PhotoShow popup page script.
 * @author Vincent | vincentwang863@gmail.com
 * @version 1.0.0.0 | 2012-12-07 | Vincent    // Initial version.
 * @version 2.0.0.0 | 2013-01-03 | Vincent    // Updates: Support turnning on/off PhotoShow for individual website.
 * @version 3.0.0.0 | 2018-11-08 | Vincent    // Updates: Reconstruction.
 * @version 3.1.0.0 | 2018-11-17 | Vincent    // Updates: Replace image resources with font icons.
 * @version 3.4.0.0 | 2019-01-24 | Vincent    // Updates: Add activation mode control.
 * @version 3.5.0.0 | 2019-04-08 | Vincent    // Updates: Get version string from extension manifest.
 * @version 3.8.3.0 | 2019-06-09 | Vincent    // Updates: Disable animation for toggle button during initialization;
 *                                            // Updates: Add hotkey description for open image in new tab.
 * @version 4.0.0.0 | 2019-11-07 | Vincent    // Updates: Apply JavaScript Arrow functions;
 *                                            // Updates: Add VIEW MODE feature;
 *                                            // Updates: Add shadow for the viewer and allow it to be hidden by user settings;
 *                                            // Updates: Allow PhotoShow logo in the viewer to be hidden by user settings;
 *                                            // Updates: Add new hotkeys 'Esc', 'Home', 'End', 'PageUp', 'PageDown', 'Arrow Left', 'Arrow Right', M', 'L', 'A' and 'P';
 *                                            // Updates: Change hotkeys for image rotation;
 *                                            // Updates: Optimize the popup page styles.
 * @version 4.0.3.0 | 2019-11-23 | Vincent    // Updates: Optimize the display style of the version text;
 *                                            // Updates: Add 'share' interface.
 * @version 4.0.5.0 | 2019-12-16 | Vincent    // Updates: Add feedback email template.
 * @version 4.0.6.0 | 2019-12-27 | Vincent    // Updates: Add PhotoShow download links for Microsoft Edge and QQ browser.
 * @version 4.0.9.3 | 2020-01-08 | Vincent    // Bug Fix: Fix the keydown events dispatching failure and simplify the keydown and keyup events responses;
 *                                            // Updates: Port localStorage APIs to chrome.storage APIs.
 * @version 4.0.11.0 | 2020-01-20 | Vincent   // Updates: Replace Array.prototype.flatMap method with Array.prototype.map to support older browsers, in response to user feedback.
 * @version 4.0.12.0 | 2020-01-24 | Vincent   // Updates: Add GitHub link.
 * @version 4.1.0.0 | 2020-03-13 | Vincent    // Updates: Add hotkey specification for image address copying.
 */

// TODO: Add animation toggle configuration (allow users to turn off all the animation).
// TODO: Support customising hotkeys.

var curTabUrl = '';

const UI_LANGUAGE = chrome.i18n.getUILanguage(),
  PHOTOSHOW_LINK = /\bFirefox\b/.test(navigator.userAgent) ?
    'https://addons.mozilla.org/' + UI_LANGUAGE + '/firefox/addon/photoshow/' :
    (/\bEdg\b/.test(navigator.userAgent) ?
      'https://microsoftedge.microsoft.com/addons/detail/afdelcfalkgcfelngdclbaijgeaklbjk?hl=' + UI_LANGUAGE :
      (/\bQQBrowser\b/.test(navigator.userAgent) ?
        'https://appcenter.browser.qq.com/search/detail?key=%E6%B5%AE%E5%9B%BE%E7%A7%80&id=mgpdnhlllbpncjpgokgfogidhoegebod%20&title=%E6%B5%AE%E5%9B%BE%E7%A7%80' :
        'https://chrome.google.com/webstore/detail/photoshow/mgpdnhlllbpncjpgokgfogidhoegebod?hl=' + UI_LANGUAGE));

function turnOnPhotoShow() {
  $('#stateMsg').text(chrome.i18n.getMessage('photoShowEnabledMsg'));
  $('#stateToggle').removeClass('disabled no-ani')
    .find('.state-icon').removeClass('icon-bubble-warn').addClass('icon-bubble-check');
  $('#stateToggleBtn').attr('title', chrome.i18n.getMessage('stateToggleOnTitle'));
};

function turnOffPhotoShow(disableAni) {
  $('#stateMsg').text(chrome.i18n.getMessage('photoShowDisabledMsg'));
  $('#stateToggle').addClass('disabled' + (disableAni ? ' no-ani' : ''))
    .find('.state-icon').removeClass('icon-bubble-check').addClass('icon-bubble-warn');
  $('#stateToggleBtn').attr('title', chrome.i18n.getMessage('stateToggleOffTitle'));
};

function getSharingUrl(link, params) {
  return params ? [link, '?'].concat(Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&')).join('') : link;
}

function updateConfigItems(configs) {
  Object.keys(configs).forEach(key => {
    let value = configs[key],
      item = $('dl[item="' + key + '"] input');

    typeof value == 'boolean' ? item.prop('checked', value) : item.val([value]);
  });
}

// Actions.
$(document).on('click.photoShow', '#stateToggleBtn', () => {    // Website switch action.
  if (curTabUrl) {
    chrome.runtime.sendMessage({
      cmd: 'SET_PHOTOSHOW_STATE',
      args: {
        tabUrl: curTabUrl,
        isPhotoShowEnabled: $('#stateToggle').hasClass('disabled')
      }
    });
  }
}).on('keydown.photoShow keyup.photoShow', e => {
  e.which == 27 || e.preventDefault();    // Do not block popup page closing.

  chrome.runtime.sendMessage({
    cmd: 'DISPATCH_HOTKEY_EVENT',
    args: (({type, which, shiftKey, ctrlKey, altKey}) => ({type, which, shiftKey, ctrlKey, altKey}))(e)
  });
}).on('change.photoShow', '.radios input[type="radio"]', e => {    // Radios action.
  var curOption = $(e.currentTarget);

  chrome.runtime.sendMessage({
    cmd: 'SET_PHOTOSHOW_CONFIGS',
    args: {
      item: curOption.closest('.radios').attr('item'),
      value: curOption.val()
    }
  });
}).on('change.photoShow', '.checkboxes input[type="checkbox"]', e => {    // Checkboxes action.
  chrome.runtime.sendMessage({
    cmd: 'SET_PHOTOSHOW_CONFIGS',
    args: {
      item: $(e.currentTarget).closest('.checkboxes').attr('item'),
      value: e.currentTarget.checked
    }
  });
});

// Response to the storage change event.
chrome.storage.onChanged.addListener(changes => {
  if (curTabUrl && changes.disabledWebsites) {
    if (changes.disabledWebsites.newValue.includes(new URL(curTabUrl).hostname)) {
      turnOffPhotoShow();
    } else {
      turnOnPhotoShow();
    }
  }

  changes.photoShowConfigs && updateConfigItems(changes.photoShowConfigs.newValue);
});

// Initialization.
$('#name').text(chrome.i18n.getMessage('extensionName') + ' ' + (/(\d+\.\d+)(?:\.\d+){0,2}( Beta)?/.test(chrome.runtime.getManifest().version_name) ? RegExp.$1 + RegExp.$2 : chrome.runtime.getManifest().version));
$('#updateDate').text(chrome.i18n.getMessage('extensionUpdateDate'));

$('#activationModeSection dt h3').text(chrome.i18n.getMessage('activationModeHeader'));
$('#activationModeDesc').text(chrome.i18n.getMessage('activationModeDesc'));
$('#activationModeOption_None').text(chrome.i18n.getMessage('activationModeOption_None'));

$('#viewModeSection dt h3').text(chrome.i18n.getMessage('viewModeHeader'));
$('#viewModeSection dd').append(['Mini', 'Light', 'Auto', 'Panoramic'].map(modeName => ['<label title="', chrome.i18n.getMessage('viewModeOptionTitle_' + modeName), '" hotkey="', modeName[0], '"><input type="radio" name="viewModeRadio" value="', modeName, '"', modeName == 'Auto' ? ' checked' : '', ' /><span>', chrome.i18n.getMessage('viewModeOption_' + modeName), ' (', modeName[0], ')</span></label>'].join('')).join(''));

$('#logoDisplaySection dt h3').text(chrome.i18n.getMessage('logoDisplayHeader'));
$('#logoDisplayDesc').text(chrome.i18n.getMessage('logoDisplayDesc'));

$('#shadowDisplaySection dt h3').text(chrome.i18n.getMessage('shadowDisplayHeader'));
$('#shadowDisplayDesc').text(chrome.i18n.getMessage('shadowDisplayDesc'));

$('#hotkeysSection dt h3').text(chrome.i18n.getMessage('hotkeysHeader'));
$('#hotkeysSection dd').append('<table>' + ['Esc', 'RotationCCW', 'RotationCW', 'Scroll', 'ScrollByPage', 'ScrollToEnds', 'OpenImageInNewTab', 'ImageSaving', 'CopyImageAddress', 'ViewModeSwitch'].map(keyName => '<tr>' + chrome.i18n.getMessage('hotkey_' + keyName) + '</tr>').join('') + '</table>');

$('#shareSection dt h3').text(chrome.i18n.getMessage('shareHeader'));

function initContactLinks() {
  var shareInfo = {
      iconTitles: chrome.i18n.getMessage('shareIconTitles').split(','),
      url: PHOTOSHOW_LINK,
      tag: chrome.i18n.getMessage('extensionName'),
      text: chrome.i18n.getMessage('shareText'),
      desc: chrome.i18n.getMessage('extensionDesc'),
      pic: 'https://lh3.googleusercontent.com/0_gQN9C5jsOE1shfXQPwqXS47Cm04A5p_EIpacTir9dsrYvh-EgJwPbjPOflyBHrPwlTdwQx=w1400-h560'
    },
    contactConfig = {
      'mail': {
        link: 'mailto:vincentwang863@gmail.com',
        data: {
          subject: chrome.i18n.getMessage('feedbackMailSubject'),
          body: chrome.i18n.getMessage('feedbackMailBody', [navigator.userAgent, chrome.runtime.getManifest().version, curTabUrl])
        }
      },
      'github': {
        link: 'https://github.com/Mr-VincentW/PhotoShow'
      },
      'facebook': {
        link: 'https://www.facebook.com/dialog/share',
        data: {
          app_id: 552746812187976,
          display: 'popup',
          href: shareInfo.url,
          sharetag: '#' + shareInfo.tag,
          quote: shareInfo.text
        }
      },
      'twitter': {
        link: 'https://twitter.com/intent/tweet',
        data: {
          url: shareInfo.url,
          hashtags: shareInfo.tag,
          text: shareInfo.text
        }
      },
      'weibo': {
        link: 'http://service.weibo.com/share/share.php',
        data: {
          appkey: 514787745,
          url: shareInfo.url,
          title: '#' + shareInfo.tag + '# ' + shareInfo.text,
          pic: shareInfo.pic
        }
      },
      'qzone': {
        link: 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey',
        data: {
          url: shareInfo.url,
          title: shareInfo.tag,
          summary: shareInfo.desc,
          desc: shareInfo.text,
          pics: shareInfo.pic
        }
      },
      'reddit': {
        link: 'https://www.reddit.com/submit',
        data: {
          url: shareInfo.text + ' ' + shareInfo.url,
          title: shareInfo.tag
        }
      },
      'tumblr': {
        link: 'http://tumblr.com/widgets/share/tool',
        data: {
          posttype: 'link',
          title: shareInfo.tag,
          tags: shareInfo.tag,
          url: shareInfo.url,
          content: shareInfo.url,
          caption: shareInfo.text
        }
      }
    };

  Object.keys(contactConfig).forEach((name, i) => $('#shareSection .icon-' + name).attr({
    href: getSharingUrl(contactConfig[name].link, contactConfig[name].data),
    title: shareInfo.iconTitles[i]
  }));
}

chrome.tabs.query({
  active: true,
  currentWindow: true
}, tabs => {
  if (!chrome.runtime.lastError && tabs && tabs.length) {
    curTabUrl = tabs[0].url;

    initContactLinks();

    chrome.runtime.sendMessage({
      cmd: 'GET_INITIAL_STATE_AND_CONFIGS',
      args: {
        tabUrl: curTabUrl
      }
    }, response => {
      if (response.isPhotoShowEnabled) {
        turnOnPhotoShow();
      } else {
        turnOffPhotoShow(true);
      }

      updateConfigItems(response.photoShowConfigs);
    });
  }
});