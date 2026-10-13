import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

// Local shared-memory primitive; no network or disk durability.
public class VersionedStore {
    record State(long value, long version) {}
    private final AtomicReference<State> state = new AtomicReference<>(new State(0, 0));
    State read() { return state.get(); }
    boolean conditionalUpdate(long expectedVersion, long nextValue) {
        if (nextValue < 0) throw new IllegalArgumentException("nonnegative value required");
        State before = read();
        if (before.version() != expectedVersion) return false;
        State after = new State(nextValue, Math.addExact(before.version(), 1));
        return state.compareAndSet(before, after);
    }
    void increment() {
        while (true) {
            State before = read();
            if (conditionalUpdate(before.version(), Math.addExact(before.value(), 1))) return;
        }
    }
    static void check(boolean ok, String message) {
        if (!ok) throw new AssertionError(message);
    }
    public static void main(String[] args) throws InterruptedException {
        VersionedStore simple = new VersionedStore();
        check(simple.conditionalUpdate(0, 1), "first CAS");
        check(!simple.conditionalUpdate(0, 2), "stale version accepted");
        System.out.println("stale update rejected; record=" + simple.read());
        VersionedStore changedBack = new VersionedStore();
        changedBack.conditionalUpdate(0, 1); changedBack.conditionalUpdate(1, 0);
        check(!changedBack.conditionalUpdate(0, 9), "value returned but old version must remain obsolete");
        VersionedStore shared = new VersionedStore();
        AtomicInteger tickets = new AtomicInteger(0);
        CountDownLatch start = new CountDownLatch(1);
        ConcurrentLinkedQueue<Throwable> failures = new ConcurrentLinkedQueue<>();
        Thread[] workers = new Thread[4];
        for (int i = 0; i < workers.length; i++) {
            workers[i] = new Thread(() -> {
                try { start.await(); for (int j = 0; j < 5000; j++) {
                    shared.increment(); tickets.getAndIncrement();
                }} catch (Throwable failure) { failures.add(failure); }
            }); workers[i].start();
        }
        start.countDown(); for (Thread worker : workers) worker.join();
        check(failures.isEmpty(), "worker failed: " + failures);
        check(shared.read().equals(new State(20000, 20000)), "lost CAS increments");
        check(tickets.get() == 20000, "lost atomic tickets");
        check(tickets.compareAndSet(20000, 20001), "AtomicInteger compareAndSet");
        check(!tickets.compareAndSet(20000, 20002), "stale AtomicInteger CAS");
        System.out.println("CAS counter: " + shared.read().value() + "; AtomicInteger tickets before final CAS: 20000");
        System.out.println("checks: first/stale CAS, version history, concurrent increments, AtomicInteger CAS passed");
    }
}
