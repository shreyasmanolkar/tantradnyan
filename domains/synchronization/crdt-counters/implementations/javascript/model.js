/* State-based grow-only counter: one component per stable writer identity. */
(function (root) {
  'use strict';
  function validate(vector) {
    if (!Array.isArray(vector) || !vector.length || !vector.every(x => Number.isSafeInteger(x) && x >= 0))
      throw new Error('A counter vector must contain nonnegative safe integers');
  }
  function create(size) {
    if (!Number.isInteger(size) || size < 1 || size > 100) throw new Error('Replica count must be 1..100');
    return Array(size).fill(0);
  }
  function increment(vector, writer) {
    validate(vector);
    if (!Number.isInteger(writer) || writer < 0 || writer >= vector.length) throw new Error('Invalid writer component');
    if (vector[writer] === Number.MAX_SAFE_INTEGER) throw new Error('Component exhausted JavaScript safe-integer range');
    const next = [...vector]; next[writer] += 1; return next;
  }
  function merge(left, right) {
    validate(left); validate(right);
    if (left.length !== right.length) throw new Error('Replica sets must match');
    return left.map((x,i)=>Math.max(x,right[i]));
  }
  function value(vector) {
    validate(vector);
    const total=vector.reduce((sum,x)=>sum+x,0);
    if (!Number.isSafeInteger(total)) throw new Error('Total exceeds JavaScript safe-integer range');
    return total;
  }
  const api={create,increment,merge,value};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.GCounter=api;
})(typeof globalThis!=='undefined'?globalThis:this);
