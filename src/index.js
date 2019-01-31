import EventEmitter from 'events';

const CLEARLIST = Symbol('clear list key');
const CPLT_FLAG = Symbol('complete flag');

class DataList extends EventEmitter{
  constructor(){
    super();
    let list = [];
    
    Object.defineProperties(this, {
      'isComplete' : {
        value : false,
        writable : true
      },
      'list': {
        get() {
          return list;
        },
        set(data) {
          if(!this.isComplete){
            if(data !== CLEARLIST){
              list = list.concat(data);
            } else {
              list = [];
            }            
          }
        }
      },
      'length' : {
        get(){
          return list.length;
        },
        set(length){
          length = parseInt(length, 10);
          if(!isNaN(length)){
            list = list.splice(0, length);
          }
        }
      }
    });
  }

  *[Symbol.iterator]() {
    for(let data of this.list){
      yield data;
    }
  }

  complete(){
    if(!this.isComplete){
      this.isComplete = true;
      this.emit('data:completed');
    }
  }

  add(data, single = false) {
    if(data === CPLT_FLAG){
      this.complete();
      return;
    }
    if(!this.isComplete){
      if (single || !Array.isArray(data)) {
        this.list.push(data);
      } else {
        this.list = data;
      }
      this.emit('data:add', data);
    }
  }

  shift(){
    return this.list.shift();
  }

  unshift(data){
    return this.list.unshift(data);
  }

  clear(){
    this.list = CLEARLIST;
  }
}

export default class Consqu extends EventEmitter {
  constructor(opts) {
    super();
    Object.assign(this, {
      nodataWaitTime: 200
    }, opts);

    let datalist = new DataList();
    Object.defineProperties(this, {
      'datalist' : {
        value : datalist
      },
      'isReady' : {
        value : false,
        writable : true
      },
      'isCompleted' : {
        value : false,
        writable : true
      },
      'isDone' : {
        value : false,
        writable : true
      },
      'isStop' : {
        value : false,
        writable : true
      },
      'running' : {
        value : 0,
        writable : true
      },
    });

    datalist.once('data:add', () => {
      this.isReady = true;
      if(this._task){
        this.run(this._task, this._multi);
        delete this._task;
        delete this._multi;
      }
    });
    datalist.on('data:add', (...args) => {
      this.emit('data:add', ...args);
    });

    datalist.on('data:completed', () => {
      this.isCompleted = true;
      this.emit('data:completed');
    });
  }

  add(...args){
    return this.datalist.add(...args);
  }
  shift(...args){
    return this.datalist.shift(...args);
  }
  unshift(...args){
    return this.datalist.unshift(...args);
  }
  complete(...args){
    return this.datalist.complete(...args);
  }
  clear(...args){
    return this.datalist.clear(...args);
  }

  done(forceStop) {
    if(!this.isDone){
      this.emit('task:done', forceStop);
      this.isDone = true;
    }
  }

  stop() {
    this.datalist = [];
    this.isStop = true;
    this.emit('task:stop');
    this.done(true);
  }
  
  async run(task, multi = 1) {
    if(!this.isReady){
      this._task = task;
      this._multi = multi;
      return;
    }
    if(this.isStop){
      return;
    }

    while (multi--) {
      const data = this.datalist.shift();
      if(data){
        this.running++;
        try{
          let ret = await task(data);
          this.emit('task:onedone', ret);
        }catch(err){
          this.emit('task:error', err);
        }
        this.running--;
        this.run(task);
      } else if(this.isCompleted){
        if(this.running == 0){
          this.done();
        }
      } else {
        setTimeout(() => {
          this.run(task);
        }, this.nodataWaitTime);
      }
    }
  }
}
Consqu.CPLT_FLAG = CPLT_FLAG;