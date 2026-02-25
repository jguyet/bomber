package org.web.bot;


import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.dataset.DataSet;
import org.nd4j.linalg.factory.Nd4j;
import org.web.Start;
import org.web.bot.ai.BotAI;
import org.web.client.Client;
import org.web.client.formatter.Formatter;
import org.web.client.message.SocketSender;
import org.web.entity.Bomb;
import org.web.entity.Player;
import org.web.enums.BinaryDirection;
import org.web.enums.PlayerDirection;
import org.web.game.world.Case;
import org.web.game.world.World;
import org.web.utils.Formulas;

import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class Bot implements Runnable {

    private final Player player;
    private ScheduledExecutorService moveScheduler = null;
    private boolean inAction = false;
    private int currentAction = 0;
    private Case lastCell;
    private ArrayList<Integer> casesVisited = new ArrayList<>();
    private BotAI botAI;
    private boolean trainingMode = true;  // Mode entraînement activé par défaut
    private double learningPercentage = 10000;// 0.01%
    private boolean predictionMode = true;
    private BinaryDirection direction = BinaryDirection.up;
    private boolean isAlive = true;
    private boolean hasMoved = false;
    private boolean moving = false;

    public Bot(BotAI botAI) {
        Case walkable = World.map.getNextRandomStartCell();
        this.player = new Player(World.getnextPlayerId(), (walkable.getx() * 32) + (32 / 2), (walkable.gety() * 32) + (32 / 2), 1, null, this);
        this.lastCell = walkable;
        this.botAI = botAI;  // Initialiser l'IA avec le réseau de neurones ou charger un modèle
        this.moveScheduler = Executors.newScheduledThreadPool(1);
        this.moveScheduler.scheduleAtFixedRate(this, 1000 / 20, 1000 / 20, TimeUnit.MILLISECONDS);
        //log("Bot initialized at: " + walkable.getId());
    }

    public Bot(BotAI botAI, Player player) {
        this.botAI = botAI;
        this.player = player;
    }

    public Player getPlayer() {
        return this.player;
    }

    public boolean isAlive() {
        return this.isAlive;
    }

    public BotAI getBotAI() {
        return this.botAI;
    }

    // Fonction pour activer/désactiver le mode entraînement
    public void setTrainingMode(boolean trainingMode) {
        this.trainingMode = trainingMode;
        log("Training mode set to: " + (trainingMode ? "enabled" : "disabled"));
    }

    private boolean stopTo(BinaryDirection direction) {
        if ((this.player.getDirection() & direction.getId()) != 0) {
            this.player.setDirection(this.player.getDirection() - direction.getId());
            return true;
        }
        return false;
    }

    // Gestion des mouvements avec logs pour mieux suivre l'état
    private boolean moveTo(Case targetCell, BinaryDirection direction, int action) {
        this.player.setDirection(this.player.getDirection() + direction.getId());
        this.player.setonMove(true);
//        if (!this.moving) {
//            this.player.setLastRefreshTime(System.currentTimeMillis());
//        }
        this.sendPlayerUpdate();
        this.moving = true;
        return true;
    }

    private int[] onTimeScoreOffer = new int[] {0, 0};

    public void doAction() {
        if (!this.isAlive) {
            return ;
        }
        Case lastCell = this.player.getCurCell();
        double lastX = this.player.getx();
        double lastY = this.player.gety();
        // move with delay accounting
        this.player.move();
        Case currentCell = this.player.getCurCell();
        double newX = this.player.getx();
        double newY = this.player.gety();
        // stop movement
        this.stopTo(BinaryDirection.left);
        this.stopTo(BinaryDirection.right);
        this.stopTo(BinaryDirection.up);
        this.stopTo(BinaryDirection.down);
        // check si a bouge
        if (newX != lastX || newY != lastY) { // has moved
            this.hasMoved = true;
//            if (onTimeScoreOffer[0] == 0 && lastCell.hasBomb() && lastCell.getId() != currentCell.getId()) {
//                this.addToScore(1000);
//                onTimeScoreOffer[0] = 1;
//            }
//            if (onTimeScoreOffer[1] == 0 && currentCell.getRightCell().getTopCell().hasBomb() || currentCell.getRightCell().getBottomCell().hasBomb() || currentCell.getLeftCell().getBottomCell().hasBomb() || currentCell.getLeftCell().getTopCell().hasBomb()) {
//                this.addToScore(5000);
//                onTimeScoreOffer[1] = 1;
//            }
        } else { //  na pas bougé
            if (this.moving) {
                this.sendPlayerUpdate();
                this.moving = false;
                this.player.setonMove(false);
            }
        }

        // Obtenir le champ de vision
        ArrayList<Double> visionFields = this.botAI.getVisionField(this.player);
        boolean learning = Formulas.getRandomValue(1, 10000) < learningPercentage;

        int tmpAction = 0;
        boolean train = false;

        Bomb b = currentCell.getBomb();

        if (b != null) {
            tmpAction = getActionIfOnBomb(b);
        } else {
            tmpAction = Formulas.getRandomValue(1, 5);

            Case targetCase = null;

            if (tmpAction == 1) {
                targetCase = this.player.getCurCell().getLeftCell();
            } else if (tmpAction == 2) {
                targetCase = this.player.getCurCell().getTopCell();
            } else if (tmpAction == 3) {
                targetCase = this.player.getCurCell().getBottomCell();
            } else if (tmpAction == 4) {
                targetCase = this.player.getCurCell().getRightCell();
            }

            if (targetCase != null) {
                ArrayList<Case> checkCases = World.map.getdircell(targetCase, BinaryDirection.all.getId(), 3);

                if (targetCase.hasBomb() || checkCases.stream().filter(Case::hasBomb).count() > 0) {
                    tmpAction = 0;
                    train = false;
                }
            }
        }

        // Utiliser l'IA pour prédire l'action
        int actionIA = botAI.predictAction(visionFields, this.player);
        int action = actionIA;
        if (actionIA != tmpAction && learning) {
            action = tmpAction;
            train = true;
        }

        // Exécuter l'action prédite par le modèle
        switch (action) {
            case 1:
                if (currentCell.getLeftCell().isWalkable()) {
                    moveTo(currentCell.getLeftCell(), BinaryDirection.left, 1);
                }
                break;
            case 2:
                if (currentCell.getTopCell().isWalkable()) {
                    moveTo(currentCell.getTopCell(), BinaryDirection.up, 2);
                }
                break;
            case 3:
                if (currentCell.getBottomCell().isWalkable()) {
                    moveTo(currentCell.getBottomCell(), BinaryDirection.down, 3);
                }
                break;
            case 4:
                if (currentCell.getRightCell().isWalkable()) {
                    moveTo(currentCell.getRightCell(), BinaryDirection.right, 4);
                }
                break;
            case 5:
                if (placeBomb(currentCell)) {
                    if (!currentCell.getTopCell().isWalkable() || !currentCell.getBottomCell().isWalkable() || !currentCell.getLeftCell().isWalkable() || !currentCell.getRightCell().isWalkable()) {
                        this.addToScore(1);
                    }
                    //log("IA Placing bomb at cell: " + currentCell.getId());
                }
                break;
        }
        // Si en mode entraînement, on collecte les données et on entraîne
        if (train) {
            this.botAI.trainModel(visionFields, this.player, action);
            // Sauvegarder le modèle après l'entraînement
        }
    }

    // Méthode pour poser une bombe
    private boolean placeBomb(Case currentCell) {
        if (!currentCell.hasBomb()) {
            return World.addBomb(this.player);
        }
        return false;
    }

    // Envoi de l'état du joueur aux clients
    public void sendPlayerUpdate() {
        for (Client c : Start.webServer.getClients()) {
            if (c != null) {
                SocketSender.sendMessage(c, Formatter.formatUpdatePlayerMessage(this.player));
            }
        }
    }

    public int getActionIfOnBomb(Bomb bomb) {
//        if (!trainingMode) return ;
//        ArrayList<Double> visionField = this.botAI.getVisionField(this.player);
        int action = 0;

        if (bomb != null) {
            if (this.player.getCurCell().getLeftCell().isWalkable()) {
                action = 1;
            }
            if (this.player.getCurCell().getTopCell().isWalkable()) {
                action = 2;
            }
            if (this.player.getCurCell().getBottomCell().isWalkable()) {
                action = 3;
            }
            if (this.player.getCurCell().getRightCell().isWalkable()) {
                action = 4;
            }
        } else {
//            if (this.player.getCurCell().getLeftCell().hasBomb()) {
//                if (!this.player.getCurCell().getBottomCell().isWalkable() || this.player.getCurCell().getTopCell().isWalkable()) {
//                    action = 2;
//                }
//                if (!this.player.getCurCell().getTopCell().isWalkable() || this.player.getCurCell().getBottomCell().isWalkable()) {
//                    action = 3;
//                }
//            } else if (this.player.getCurCell().getTopCell().hasBomb()) {
//                if (!this.player.getCurCell().getRightCell().isWalkable() || this.player.getCurCell().getLeftCell().isWalkable()) {
//                    action = 1;
//                }
//                if (!this.player.getCurCell().getLeftCell().isWalkable() || this.player.getCurCell().getRightCell().isWalkable()) {
//                    action = 4;
//                }
//            } else if (this.player.getCurCell().getRightCell().hasBomb()) {
//                if (!this.player.getCurCell().getBottomCell().isWalkable() || this.player.getCurCell().getTopCell().isWalkable()) {
//                    action = 2;
//                }
//                if (!this.player.getCurCell().getTopCell().isWalkable() || this.player.getCurCell().getBottomCell().isWalkable()) {
//                    action = 3;
//                }
//            } else if (this.player.getCurCell().getBottomCell().hasBomb()) {
//                if (!this.player.getCurCell().getRightCell().isWalkable() || this.player.getCurCell().getLeftCell().isWalkable()) {
//                    action = 1;
//                }
//                if (!this.player.getCurCell().getLeftCell().isWalkable() || this.player.getCurCell().getRightCell().isWalkable()) {
//                    action = 4;
//                }
//            } else if (this.player.getCurCell().getLeftCell().getTopCell().hasBomb()) {
//                if (this.player.getCurCell().getRightCell().isWalkable()) {
//                    action = 4;
//                } else if (this.player.getCurCell().getBottomCell().isWalkable()) {
//                    action = 3;
//                } else {
//                    action = 0;
//                }
//            } else if (this.player.getCurCell().getTopCell().getRightCell().hasBomb()) {
//                if (this.player.getCurCell().getLeftCell().isWalkable()) {
//                    action = 1;
//                } else if (this.player.getCurCell().getBottomCell().isWalkable()) {
//                    action = 3;
//                } else {
//                    action = 0;
//                }
//            } else if (this.player.getCurCell().getRightCell().getBottomCell().hasBomb()) {
//                if (this.player.getCurCell().getLeftCell().isWalkable()) {
//                    action = 1;
//                } else if (this.player.getCurCell().getTopCell().isWalkable()) {
//                    action = 2;
//                } else {
//                    action = 0;
//                }
//            } else if (this.player.getCurCell().getBottomCell().getLeftCell().hasBomb()) {
//                if (this.player.getCurCell().getRightCell().isWalkable()) {
//                    action = 4;
//                } else if (this.player.getCurCell().getTopCell().isWalkable()) {
//                    action = 2;
//                } else {
//                    action = 0;
//                }
//            }
        }
        return action;
    }

    public void die() {
        this.die(true);
    }

    public void die(boolean checkResult) {
        this.isAlive = false;
        if (!this.hasMoved) {
            this.addToScore(-1.0);
        }
        this.player.die(null);
        this.player.stopScheduler();
        World.bots.remove(this);
        for (Client c : Start.webServer.getClients()) {
            if (c != null) {
                SocketSender.sendMessage(c, Formatter.formatDeletePlayerMessage(this.player));
            }
        }
        if (checkResult) {
            Start.checkAIResult(false);
        }
        this.moveScheduler.shutdown();
    }

    public void addToScore(double amount) {
        this.botAI.addToScore(amount);
    }

    // Ajout de logs pour le débogage
    private void log(String message) {
        System.out.println("[Bot"+this.player.getId()+"] " + message);
    }

    @Override
    public void run() {
        try {
            if (isAlive) {
                doAction();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
