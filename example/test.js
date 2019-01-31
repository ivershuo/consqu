const Consqu = require('../lib').default;

const taskStartTime = Date.now();

const cs = new Consqu();
cs.on('task:done', () => {
  console.log(`\nall data done!, after ${(Date.now() - taskStartTime)/1000} s.`);
});

/** a async func, for example, the function to get article's content from web*/
function someAsyncFunc (data){
  return new Promise((resolve, reject) => {
    let startTime = Date.now();
    console.log(`... deal with data(${data})`);
    setTimeout(() => {
      let endTime = Date.now();
      console.log(`--> got the data(${data}) result after ${endTime - startTime} ms.`);
      resolve();
    }, Math.ceil(Math.random() * 1000));
  });
};
cs.run(someAsyncFunc, 20);

/** some task data list. for example, some article's urls*/
const dataLen = 100 + Math.ceil(Math.random() * 100);
let  dataId = 0;
while(dataId++ < dataLen){
  cs.add(dataId);
}
cs.add('test1');
cs.add('test2');
cs.add(['test3', 'test4']);
setTimeout(() => {
  cs.add('test5');
}, 1000);
setTimeout(() => {
  /** the last data, or use : cs.complete() */
  cs.add(Consqu.CPLT_FLAG);
}, 200);