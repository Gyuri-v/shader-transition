import './_transtion';
import './_changeScene';

import '../css/style.css';
import { Transition } from './_transtion';
import { ChangeScene } from './_changeScene';
import { Fake3d } from './_fake3d';

const DEBUG = location.search.indexOf('debug') > -1;


export const $container = document.querySelector('.container');
export const $canvas = document.querySelector('canvas.webgl');
export const $sections = $container.querySelector('.sections');

export let areaWidth, areaHeight;

let loadedPageNum = 0;


const pages = [
  'transition',
  'changescene',
  'fake3d',
].map((page) => {
  const name = page;
  return {
    name, 
    url: `/resources/pages/${page}.html`,
  }
});

pages.forEach(page => {
  fetch(page.url)
    .then((response) => response.text())
    .then((html) => {
      html = html.match(/<!-- *content * -->([\s\S]+)<!-- *content * \/\/ *-->/);
      page.$node = html[1];
      loadedPageNum++;

      if ( loadedPageNum === pages.length ) {
        renderPage();
      }
    });
});

console.log('pages', pages);

function renderPage () {
  if ( location.href.indexOf('changescene') > -1 ) {
    const page = pages.find(item => item.name == 'changescene');
    $sections.innerHTML = page.$node;
    ChangeScene();
  } else if ( location.href.indexOf('transition') > -1 ) {
    const page = pages.find(item => item.name == 'transition');
    $sections.innerHTML = page.$node;
    Transition();
  } else if ( location.href.indexOf('fake3d') > -1 ) {
    const page = pages.find(item => item.name == 'fake3d');
    $sections.innerHTML = page.$node;
    Fake3d();
  } else {
    const page = pages.find(item => item.name == 'menu');
    $container.innerHTML = page.$node;
  }
}

const resize = function () {
  areaWidth = window.innerWidth;
  areaHeight = window.innerHeight;
}

resize();
window.addEventListener('resize', resize);