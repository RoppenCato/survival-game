// Renders island.png: the chart of a World and one painted piece of its coast, to check src/world.js without a browser.
// Run from the project root:  node tools/visual/island.js [seed]
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('fs');
global.__mk=(w,h)=>createCanvas(w,h);
const kit=require('../../src/stylelab.js').kit, World=require('../../src/world.js');
const seed=parseInt(process.argv[2],10)||11;
const w=World.make(kit,{isle:240,count:1,seed:seed});
w.plant(); w.camp(); w.sortBuckets();
const chart=w.chart(300), hx=Math.floor(w.home.x/w.T/w.CT), hy=Math.floor(w.home.y/w.T/w.CT), piece=w.bakeChunk(hx,hy);
const cv=createCanvas(chart.width*2+piece.width/2+30,Math.max(chart.height*2,piece.height/2)+20),c=cv.getContext('2d');
c.fillStyle='#1d212a';c.fillRect(0,0,cv.width,cv.height);c.imageSmoothingEnabled=false;
c.drawImage(chart,10,10,chart.width*2,chart.height*2);c.imageSmoothingEnabled=true;
c.drawImage(piece,chart.width*2+20,10,piece.width/2,piece.height/2);
fs.writeFileSync('island.png',cv.toBuffer('image/png'));
console.log('island '+seed+': '+w.GW+'x'+w.GH+' tiles, '+w.stats.trees+' trees, '+w.stats.rocks+' rocks, '+w.stats.landTiles+' land tiles; wrote island.png');
