package org.web.entity;

import org.web.Start;
import org.web.client.Client;
import org.web.client.message.SocketSender;
import org.web.game.world.Case;
import org.web.game.world.World;
import org.web.utils.TimerWaiter;

public class Item implements Runnable {

    private int id;
    private int templateId;
    private double x;
    private double y;
    private Case curcell;
    private TimerWaiter timer = new TimerWaiter();

    public Item(int id, int templateId, double x, double y, Case cell) {
        this.id = id;
        this.templateId = templateId;
        this.x = x;
        this.y = y;
        this.curcell = cell;
        this.curcell.addItem(this);
        timer.addNext(this, 10000);
    }

    public int getId() {
        return this.id;
    }

    public int getTemplateId() {
        return this.templateId;
    }

    public double getx()
    {
        return (x);
    }

    public double gety()
    {
        return (y);
    }

    public void disappear() {
        this.curcell.addItem(null);
        World.items.remove(this);
        for (Client ci : Start.webServer.getClients())
        {
            if (ci == null)
                continue ;
            SocketSender.sendMessage(ci, "ID"
                    + this.getId()
                    + "|" + this.getTemplateId()
                    + "|" + this.getx()
                    + "|" + this.gety());
        }
    }

    @Override
    public void run() {
        disappear();
    }
}
