package org.web.utils;

public class TupleThree<A, B, C> {

    private final A first;
    private final B second;
    private final C third;

    public TupleThree(A first, B second, C third) {
        this.first = first;
        this.second = second;
        this.third = third;
    }

    public A getFirst() {
        return first;
    }

    public B getSecond() {
        return second;
    }
    
    public C getThird() {
        return third;
    }
}
