function Foo() {
    Foo.count++;
}

Foo.count = 0;
Foo.prototype.invoke = function() {
  console.log(Foo.count);
  try {
      new Foo().invoke();
  } catch(ex){
    console.log("Maximum call stack size: " + Foo.count);
  }
};

new Foo().invoke();
