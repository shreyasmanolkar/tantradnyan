import java.lang.invoke.MethodHandles;
import java.lang.invoke.VarHandle;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

/** Educational shared-memory experiments; no network/storage coordination. */
public final class ConcurrencyLab {
    @FunctionalInterface interface Checked { void run() throws Exception; }
    static int passed;
    static void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
    static void await(CountDownLatch latch) throws InterruptedException {
        check(latch.await(5, TimeUnit.SECONDS), "latch timeout");
    }
    static void barrier(CyclicBarrier barrier) throws Exception { barrier.await(5, TimeUnit.SECONDS); }
    static void parallel(int n, Checked work) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(n);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> tasks = new ArrayList<>();
        try {
            for (int i=0; i<n; i++) tasks.add(pool.submit(() -> {
                try { await(start); work.run(); } catch (Exception e) { throw new RuntimeException(e); }
            }));
            start.countDown();
            for (Future<?> task : tasks) task.get(10, TimeUnit.SECONDS);
        } finally { pool.shutdownNow(); check(pool.awaitTermination(5, TimeUnit.SECONDS), "worker leak"); }
    }
    static void test(String name, Checked work) throws Exception {
        work.run(); passed++; System.out.println("PASS " + name);
    }

    static final class VolatileCounter { volatile int value; }
    record State(long value, long version) {}
    static final class VersionedCounter {
        final AtomicReference<State> current = new AtomicReference<>(new State(0,0));
        State read() { return current.get(); }
        boolean replace(State expected, long value) {
            if (value < 0) throw new IllegalArgumentException("negative value");
            return current.compareAndSet(expected, new State(value, Math.addExact(expected.version(),1)));
        }
        State increment() {
            while (true) {
                State before=read(), after=new State(Math.addExact(before.value(),1),Math.addExact(before.version(),1));
                if (current.compareAndSet(before,after)) return after;
            }
        }
    }
    static final class Published {
        int payload; volatile boolean ready;
    }
    static final class Released {
        int payload; int ready;
        static final VarHandle FLAG;
        static { try { FLAG=MethodHandles.lookup().findVarHandle(Released.class,"ready",int.class); }
            catch (ReflectiveOperationException e) { throw new ExceptionInInitializerError(e); } }
    }
    static final class Node { final String value; Node next; Node(String value, Node next){this.value=value;this.next=next;} }
    // Immutable links and no recycling; this is not the intentionally unsafe ABA demo above.
    static final class Stack<T> {
        record Link<T>(T value, Link<T> next) {}
        final AtomicReference<Link<T>> head=new AtomicReference<>();
        void push(T value) {
            Objects.requireNonNull(value);
            while (true) { Link<T> before=head.get(); if(head.compareAndSet(before,new Link<>(value,before)))return; }
        }
        T pop() {
            while (true) { Link<T> before=head.get(); if(before==null)return null; if(head.compareAndSet(before,before.next()))return before.value(); }
        }
    }
    static final class OneSlot<T> {
        final ReentrantLock lock=new ReentrantLock();
        final Condition notEmpty=lock.newCondition(),notFull=lock.newCondition();
        T item;
        void put(T value) throws InterruptedException {
            Objects.requireNonNull(value);lock.lockInterruptibly();
            try { while(item!=null)notFull.await();item=value;notEmpty.signal(); }
            finally { lock.unlock(); }
        }
        T take() throws InterruptedException {
            lock.lockInterruptibly();
            try { while(item==null)notEmpty.await();T result=item;item=null;notFull.signal();return result; }
            finally { lock.unlock(); }
        }
        // Used to force a wake-up without satisfying the predicate, not a claim to force VM spurious wake-up.
        void signalWithoutItem(){lock.lock();try{notEmpty.signalAll();}finally{lock.unlock();}}
        boolean readerWaiting(){lock.lock();try{return lock.hasWaiters(notEmpty);}finally{lock.unlock();}}
    }
    static void eventually(java.util.function.BooleanSupplier condition) throws Exception {
        long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);
        while(!condition.getAsBoolean()){check(System.nanoTime()<end,"predicate timeout");Thread.sleep(1);}
    }
    record Operation(long start,long end,int returned) {}
    static boolean linearizable(List<Operation> history) { return order(history,new boolean[history.size()],0,0); }
    static boolean order(List<Operation> h, boolean[] chosen, int depth,int value) {
        if(depth==h.size())return true;
        for(int i=0;i<h.size();i++)if(!chosen[i]&&h.get(i).returned()==value){
            boolean eligible=true;
            for(int j=0;j<h.size();j++)if(!chosen[j]&&j!=i&&h.get(j).end()<h.get(i).start())eligible=false;
            if(eligible){chosen[i]=true;if(order(h,chosen,depth+1,value+1))return true;chosen[i]=false;}
        }
        return false;
    }
    // Domain algorithm: exact substrings of length k; not a synchronization protocol.
    static Map<String,Integer> kmers(String dna,int k) {
        if(k<1||!dna.matches("[ACGT]*"))throw new IllegalArgumentException("DNA/k");
        Map<String,Integer> counts=new TreeMap<>();
        for(int i=0;i+k<=dna.length();i++)counts.merge(dna.substring(i,i+k),1,Integer::sum);
        return counts;
    }

    public static void main(String[] args) throws Exception {
        if(args.length==1&&args[0].equals("process-counter")) {
            AtomicInteger local=new AtomicInteger();System.out.println(local.incrementAndGet());return;
        }
        test("volatile read-modify-write loses an update under a forced schedule",()->{
            VolatileCounter c=new VolatileCounter();CyclicBarrier read=new CyclicBarrier(2);
            parallel(2,()->{int before=c.value;barrier(read);c.value=before+1;});check(c.value==1,"expected controlled loss");
        });
        test("fetch-and-add preserves 20000 concurrent increments",()->{
            AtomicInteger c=new AtomicInteger();parallel(4,()->{for(int i=0;i<5000;i++)c.getAndIncrement();});check(c.get()==20000,"lost atomic increment");
        });
        test("AtomicReference CAS compares identity, not equal record contents",()->{
            State a=new State(1,0),equal=new State(1,0);AtomicReference<State> r=new AtomicReference<>(a);
            check(a.equals(equal),"record equality");check(!r.compareAndSet(equal,new State(2,1)),"CAS accepted distinct reference");check(r.compareAndSet(a,new State(2,1)),"CAS failed exact reference");
        });
        test("fresh immutable versions reject stale and value-returned snapshots",()->{
            VersionedCounter c=new VersionedCounter();State old=c.read();check(c.replace(old,1),"first");check(c.replace(c.read(),0),"back");check(!c.replace(old,9),"stale old reference");check(c.read().equals(new State(0,2)),"version rollback");
        });
        test("versioned CAS retry publishes one coherent value/version pair",()->{
            VersionedCounter c=new VersionedCounter();parallel(4,()->{for(int i=0;i<5000;i++)c.increment();});check(c.read().equals(new State(20000,20000)),"lost pair update");
        });
        test("CAS retry must not execute side effects before success",()->{
            AtomicInteger state=new AtomicInteger(),attemptEffects=new AtomicInteger();CyclicBarrier read=new CyclicBarrier(2);
            parallel(2,()->{int before=state.get();barrier(read);attemptEffects.incrementAndGet();if(!state.compareAndSet(before,before+1)){attemptEffects.incrementAndGet();state.incrementAndGet();}});
            check(state.get()==2&&attemptEffects.get()==3,"forced retry did not duplicate speculative effect");
        });
        test("volatile publication makes prior ordinary payload visible",()->{
            Published p=new Published();AtomicBoolean checked=new AtomicBoolean();
            parallel(2,()->{if(checked.compareAndSet(false,true)){p.payload=42;p.ready=true;}else{long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);while(!p.ready){check(System.nanoTime()<end,"publication timeout");Thread.onSpinWait();}check(p.payload==42,"bad published payload");}});
        });
        test("matching release/acquire publication exposes initialized payload",()->{
            Released p=new Released();AtomicBoolean writer=new AtomicBoolean();
            parallel(2,()->{if(writer.compareAndSet(false,true)){p.payload=99;Released.FLAG.setRelease(p,1);}else{long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);while((int)Released.FLAG.getAcquire(p)!=1){check(System.nanoTime()<end,"release timeout");Thread.onSpinWait();}check(p.payload==99,"bad acquire payload");}});
        });
        test("pointer-only ABA accepts stale next and resurrects a popped node",()->{
            Node c=new Node("C",null),b=new Node("B",c),a=new Node("A",b);AtomicReference<Node> head=new AtomicReference<>(a);
            CountDownLatch captured=new CountDownLatch(1),cycled=new CountDownLatch(1);AtomicBoolean staleSuccess=new AtomicBoolean(),chosen=new AtomicBoolean();
            parallel(2,()->{if(chosen.compareAndSet(false,true)){Node before=head.get(),next=before.next;captured.countDown();await(cycled);staleSuccess.set(head.compareAndSet(before,next));}else{await(captured);check(head.compareAndSet(a,b),"pop A");check(head.compareAndSet(b,c),"pop B");a.next=c;check(head.compareAndSet(c,a),"reuse A");cycled.countDown();}});
            check(staleSuccess.get()&&head.get()==b,"ABA schedule failed to expose stale resurrection");
        });
        test("stamped ABA rejects the same reference with obsolete history stamp",()->{
            Node c=new Node("C",null),b=new Node("B",c),a=new Node("A",b);AtomicStampedReference<Node> head=new AtomicStampedReference<>(a,0);
            CountDownLatch captured=new CountDownLatch(1),cycled=new CountDownLatch(1);AtomicBoolean staleSuccess=new AtomicBoolean(),chosen=new AtomicBoolean();
            parallel(2,()->{if(chosen.compareAndSet(false,true)){int[] stamp=new int[1];Node before=head.get(stamp),next=before.next;captured.countDown();await(cycled);staleSuccess.set(head.compareAndSet(before,next,stamp[0],stamp[0]+1));}else{await(captured);check(head.compareAndSet(a,b,0,1),"pop A");check(head.compareAndSet(b,c,1,2),"pop B");a.next=c;check(head.compareAndSet(c,a,2,3),"reuse A");cycled.countDown();}});
            check(!staleSuccess.get()&&head.getReference()==a&&head.getStamp()==3,"stamped stale operation accepted");
        });
        test("immutable-link stack preserves all 4000 unique concurrent values",()->{
            Stack<Integer> s=new Stack<>();AtomicInteger ids=new AtomicInteger();parallel(4,()->{for(int i=0;i<1000;i++)s.push(ids.getAndIncrement());});Set<Integer> seen=ConcurrentHashMap.newKeySet();
            parallel(4,()->{Integer x;while((x=s.pop())!=null)check(seen.add(x),"duplicate pop");});check(seen.size()==4000&&s.pop()==null,"missing stack values");
        });
        test("condition waiter rechecks predicate after a signal without data",()->{
            OneSlot<Integer> slot=new OneSlot<>();ExecutorService pool=Executors.newSingleThreadExecutor();
            try{Future<Integer> result=pool.submit(slot::take);eventually(slot::readerWaiting);slot.signalWithoutItem();eventually(slot::readerWaiting);check(!result.isDone(),"signal treated as data");slot.put(7);check(result.get(5,TimeUnit.SECONDS)==7,"wrong slot value");}
            finally{pool.shutdownNow();check(pool.awaitTermination(5,TimeUnit.SECONDS),"waiter leak");}
        });
        test("interruption exits condition wait without leaking its lock",()->{
            OneSlot<Integer> slot=new OneSlot<>();CountDownLatch done=new CountDownLatch(1);AtomicReference<Throwable> failure=new AtomicReference<>();
            Thread waiter=new Thread(()->{try{slot.take();failure.set(new AssertionError("unexpected data"));}catch(InterruptedException expected){}catch(Throwable e){failure.set(e);}finally{done.countDown();}});waiter.setDaemon(true);waiter.start();eventually(slot::readerWaiting);waiter.interrupt();await(done);check(failure.get()==null,"waiter failed");slot.put(8);check(slot.take()==8,"lock leaked");
        });
        test("semaphore bounds active work and returns permits in finally",()->{
            Semaphore permits=new Semaphore(2);AtomicInteger active=new AtomicInteger(),max=new AtomicInteger();
            parallel(6,()->{permits.acquire();try{int n=active.incrementAndGet();max.accumulateAndGet(n,Math::max);Thread.yield();}finally{active.decrementAndGet();permits.release();}});
            check(max.get()<=2&&active.get()==0&&permits.availablePermits()==2,"permit/active leak");
        });
        test("read-write lock permits downgrading but does not provide a read upgrade",()->{
            ReentrantReadWriteLock rw=new ReentrantReadWriteLock();rw.readLock().lock();try{check(!rw.writeLock().tryLock(),"read upgrade unexpectedly succeeded");}finally{rw.readLock().unlock();}
            rw.writeLock().lock();rw.readLock().lock();rw.writeLock().unlock();check(rw.getReadHoldCount()==1,"downgrade lost read lock");rw.readLock().unlock();
        });
        test("consistent lock order preserves transfer invariant",()->{
            ReentrantLock first=new ReentrantLock(),second=new ReentrantLock();int[] balances={10000,10000};AtomicInteger direction=new AtomicInteger();
            parallel(4,()->{boolean forward=direction.getAndIncrement()%2==0;for(int i=0;i<1000;i++){first.lock();second.lock();try{int from=forward?0:1,to=1-from;check(balances[from]>0,"negative source");balances[from]--;balances[to]++;}finally{second.unlock();first.unlock();}}});check(balances[0]+balances[1]==20000,"transfer invariant");
        });
        test("finite recorded fetch-and-add history admits real-time respecting order",()->{
            AtomicInteger c=new AtomicInteger();AtomicLong clock=new AtomicLong();List<Operation> history=new CopyOnWriteArrayList<>();parallel(4,()->{long start=clock.getAndIncrement();int result=c.getAndIncrement();long end=clock.getAndIncrement();history.add(new Operation(start,end,result));});check(linearizable(history),"nonlinearizable recorded history");
        });
        test("history checker rejects duplicate increment outcome and real-time reversal",()->{
            check(!linearizable(List.of(new Operation(0,3,0),new Operation(1,4,0))),"duplicate result accepted");check(!linearizable(List.of(new Operation(0,1,1),new Operation(2,3,0))),"real-time violation accepted");
        });
        test("separate AtomicIntegers do not form an atomic multi-field invariant",()->{
            AtomicInteger a=new AtomicInteger(100),b=new AtomicInteger(100);CountDownLatch halfway=new CountDownLatch(1),observed=new CountDownLatch(1);AtomicBoolean chosen=new AtomicBoolean();
            parallel(2,()->{if(chosen.compareAndSet(false,true)){a.decrementAndGet();halfway.countDown();await(observed);b.incrementAndGet();}else{await(halfway);check(a.get()+b.get()==199,"torn logical pair not exposed");observed.countDown();}});check(a.get()+b.get()==200,"final total");
        });
        test("k-mer counting is a domain algorithm with overlapping windows",()->{
            check(kmers("ACGACG",3).equals(Map.of("ACG",2,"CGA",1,"GAC",1)),"k-mer counts");check(kmers("AC",3).isEmpty(),"short sequence");
        });
        System.out.println("Java scenarios passed: " + passed);
    }
}
