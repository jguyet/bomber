package org.web.bot.ai;

import org.deeplearning4j.datasets.iterator.DataSetIteratorSplitter;
import org.deeplearning4j.nn.api.OptimizationAlgorithm;
import org.deeplearning4j.nn.conf.MultiLayerConfiguration;
import org.deeplearning4j.nn.conf.NeuralNetConfiguration;
import org.deeplearning4j.nn.conf.layers.DenseLayer;
import org.deeplearning4j.nn.conf.layers.OutputLayer;
import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.deeplearning4j.nn.weights.WeightInit;
import org.deeplearning4j.util.ModelSerializer;
import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.dataset.DataSet;
import org.nd4j.linalg.dataset.MultiDataSet;
import org.nd4j.linalg.dataset.api.DataSetPreProcessor;
import org.nd4j.linalg.dataset.api.iterator.DataSetIterator;
import org.nd4j.linalg.dataset.api.iterator.DataSetIteratorFactory;
import org.nd4j.linalg.dataset.api.preprocessor.*;
import org.nd4j.linalg.factory.Nd4j;
import org.nd4j.linalg.learning.config.Nesterovs;
import org.nd4j.linalg.learning.config.RmsProp;
import org.nd4j.linalg.lossfunctions.LossFunctions;
import org.nd4j.linalg.activations.Activation;
import org.nd4j.linalg.learning.config.Adam;
import org.web.bot.Bot;
import org.web.entity.Player;
import org.web.game.world.Case;
import org.web.game.world.World;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

public class BotAI {

    private MultiLayerNetwork model;
    private static final String MODEL_PATH = "botModel.zip";
    private static final double MUTATION_RATE = 0.2;
    private double score = 0;

    public BotAI(boolean fromFile) {
        if (fromFile) {
            File modelFile = new File("./botModel.zip");
            if (modelFile.exists()) {
                try {
                    this.model = ModelSerializer.restoreMultiLayerNetwork(modelFile);
                    System.out.println("Modèle chargé depuis le fichier : " + "./botModel.zip");
                } catch (IOException e) {
                    e.printStackTrace();
                    initModel();  // Initialiser un nouveau modèle si le chargement échoue
                }
            } else {
                initModel();  // Initialiser un nouveau modèle si le fichier n'existe pas
            }
        } else {
            initModel();
        }
    }

    public BotAI(int genId) {
        // Charger le modèle si un fichier existe, sinon initialiser un nouveau modèle
        File modelFile = new File("./gens/" + genId + ".zip");
        if (modelFile.exists()) {
            try {
                this.model = ModelSerializer.restoreMultiLayerNetwork(modelFile);
                this.mutate();
                System.out.println("Modèle chargé depuis le fichier : " + "./gens/" + genId + ".zip");
            } catch (IOException e) {
                e.printStackTrace();
                initModel();  // Initialiser un nouveau modèle si le chargement échoue
            }
        } else {
            initModel();  // Initialiser un nouveau modèle si le fichier n'existe pas
            this.mutate();
        }
    }

    public static final int INPUT_SIZE = 125 + 3;
    public static final int OUTPUT_SIZE = 6;

    private MultiLayerConfiguration getConf() {
        int inputSize = INPUT_SIZE;//25 + 6;  // 100 pour le champ de vision 10x10 + 6 informations sur le joueur
        int denseLayerSize = INPUT_SIZE * 2; // 64
        int outputSize = OUTPUT_SIZE;   // 6 classes (Rien, Up, Down, Right, Left, Bombe)

        return new NeuralNetConfiguration.Builder()
                .seed(123) // Seed pour la reproductibilité
                .optimizationAlgo(OptimizationAlgorithm.STOCHASTIC_GRADIENT_DESCENT)
                .updater(new Nesterovs(0.001, 0.9))
                .weightInit(WeightInit.XAVIER) // Initialisation des poids
                .list()
                .layer(new DenseLayer.Builder()
                        .nIn(inputSize)
                        .nOut(denseLayerSize)  // Mettre à jour avec le nouvel inputSize
                        .activation(Activation.RELU)
                        .build())
                .layer(new DenseLayer.Builder()
                        .nIn(denseLayerSize)
                        .nOut(32)
                        .activation(Activation.RELU)
                        .build())
                .layer(new OutputLayer.Builder(LossFunctions.LossFunction.NEGATIVELOGLIKELIHOOD)
                        .activation(Activation.SOFTMAX)
                        .nIn(32)
                        .nOut(outputSize)
                        .build())
                .build();
    }

    // Initialiser le modèle
    private void initModel() {
        this.model = new MultiLayerNetwork(this.getConf());
        this.model.init();
    }

    // Sauvegarder le modèle dans un fichier
    public void saveModel() {
        try {
            ModelSerializer.writeModel(this.model, new File(MODEL_PATH), true);
//            System.out.println("Modèle sauvegardé dans : " + MODEL_PATH);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void saveGen(String path) {
        try {
            ModelSerializer.writeModel(this.model, new File(path), true);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public INDArray generateInput(ArrayList<Double> visionFields, Player player) {
        INDArray input = Nd4j.create(1, INPUT_SIZE);

        for (int i = 0; i < visionFields.size(); i++) {
            input.putScalar(0, i, visionFields.get(i));
        }
        input.putScalar(0, INPUT_SIZE - 3, player.getBombCounter() / 10);  // Nombre de bombes posées
        input.putScalar(0, INPUT_SIZE - 2, player.getMaxBombs() / 10);     // Limite de bombes
        input.putScalar(0, INPUT_SIZE - 1, player.getRange() / 10);        // Portée des bombe
        return input;
    }

    public INDArray generateLabel(int action) {
        INDArray label = Nd4j.create(1, OUTPUT_SIZE);
        if (action < 0 || action >= OUTPUT_SIZE) {
            throw new IllegalArgumentException("Action is out of bounds: " + action);
        }
        label.putScalar(new int[]{0, action}, 1);  // Encoder l'action choisie
        return label;
    }

    public DataSet generateNormalizedDataSet(ArrayList<Double> visionFields, Player player, int action) {
        INDArray input = this.generateInput(visionFields, player);
        INDArray label = this.generateLabel(action);
        return new DataSet(input, label);
    }

    public MultiDataSet buildMultiDataSet(ArrayList<DataSet> dataSets) {
        INDArray[] features = dataSets.stream().map(DataSet::getFeatures).collect(Collectors.toList()).toArray(new INDArray[dataSets.size()]);
        INDArray[] labels = dataSets.stream().map(DataSet::getLabels).collect(Collectors.toList()).toArray(new INDArray[dataSets.size()]);
        return new MultiDataSet(features, labels);
    }

    public void trainModelWithMultiDataSet(ArrayList<DataSet> dataSets) {
        DataSetIterator d = new DataSetIterator() {
            private int current = 0;
            @Override
            public DataSet next(int i) {
                return dataSets.get(i);
            }

            @Override
            public int inputColumns() {
                return 0;
            }

            @Override
            public int totalOutcomes() {
                return 0;
            }

            @Override
            public boolean resetSupported() {
                return false;
            }

            @Override
            public boolean asyncSupported() {
                return false;
            }

            @Override
            public void reset() {

            }

            @Override
            public int batch() {
                return dataSets.size();
            }

            @Override
            public void setPreProcessor(DataSetPreProcessor dataSetPreProcessor) {

            }

            @Override
            public DataSetPreProcessor getPreProcessor() {
                return null;
            }

            @Override
            public List<String> getLabels() {
                return List.of();
            }

            @Override
            public boolean hasNext() {
                return current < dataSets.size();
            }

            @Override
            public DataSet next() {
                return dataSets.get(current++);
            }
        };
//        DataSetIteratorSplitter t = new DataSetIteratorSplitter();
        this.getModel().fit(d);
    }

    // Entraîner le modèle avec les nouvelles données
    public void trainModel(ArrayList<Double> visionFields, Player player, int action) {

        // Effectuer l'entraînement (en ligne, après chaque action)
//        for (int i = 0; i < 10; i++) {
//            this.getModel().fit(dataSet);
//            if (Nd4j.argMax(this.getModel().output(input),1).getInt(0) == action) {
//                break ;
//            }
//        }
        DataSet dataSet = this.generateNormalizedDataSet(visionFields, player, action);
        if ((Nd4j.argMax(this.getModel().output(dataSet.getFeatures()),1).getInt(0) == action)) {
            return ;
        }
        this.getModel().fit(dataSet);
        System.out.println("BOT a " + ((Nd4j.argMax(this.getModel().output(dataSet.getFeatures()),1).getInt(0) == action) ? "A pris" : "Pas A pris"));
    }

    // Fonction pour prédire l'action en fonction du champ de vision
    public int predictAction(ArrayList<Double> visionFields, Player player) {
        try {
            DataSet dataSet = this.generateNormalizedDataSet(visionFields, player, 0);
//            INDArray input = generateInput(visionField, player);
            // Prédire l'action à partir des données d'entrée complètes
            INDArray output = this.model.output(dataSet.getFeatures());
            return Nd4j.argMax(output, 1).getInt(0);  // Renvoie l'index de l'action prédite
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    public BotAI crossOver(BotAI otherParent) {
        BotAI child = new BotAI(false);

        // Accéder aux poids des deux modèles
        INDArray parent1Weights = this.model.params();
        INDArray parent2Weights = otherParent.model.params();

        // Mélanger les poids des deux parents
        Random rand = new Random();
        for (int i = 0; i < parent1Weights.length(); i++) {
            double weight = rand.nextBoolean() ? parent1Weights.getDouble(i) : parent2Weights.getDouble(i);
            child.model.params().putScalar(i, weight);
        }

        return child;
    }

    public void mutate() {
        INDArray weights = this.model.params();
        Random rand = new Random();

        // Appliquer la mutation sur les poids de manière aléatoire
//        boolean muted = false;
//        while (!muted) {
            for (int i = 0; i < weights.length(); i++) {
                if (rand.nextDouble() < MUTATION_RATE) {
                    double mutation = (rand.nextDouble() - 0.5);
                    double newWeight = mutation;//weights.getDouble(i) + mutation;
//                    if (newWeight > 1) {
//                        newWeight -= 1;
//                    }
//                    if (newWeight < -1) {
//                        newWeight += 1;
//                    }
//                    if (newWeight > 1 || newWeight < -1) {
//                        continue;
//                    }
                    model.params().putScalar(i, newWeight);
//                    muted = true;
                }
            }
//        }
    }

    // Fonction pour obtenir le champ de vision 10x10
    public ArrayList<Double> getVisionField(Player player) {
//        double[] visionField = new double[8];
//
//        double distance = 10.0;
//        //////////////////////////////////////
//        // Walls
//        //////////////////////////////////////
//        Case rightCell = player.getCurCell().getRightCell();
//        double rightRayParam = 0;
//        for (int i = 0; i < distance; i++) {
//            if (rightCell.isWalkable()) {
//                rightRayParam += 0.1; // 0.1 par 0.1
//            } else {
//                break;
//            }
//            rightCell = rightCell.getRightCell();
//        }
//        Case leftCell = player.getCurCell().getLeftCell();
//        double leftRayParam = 0;
//        for (int i = 0; i < distance; i++) {
//            if (leftCell.isWalkable()) {
//                leftRayParam += 0.1; // 0.1 par 0.1
//            } else {
//                break ;
//            }
//            leftCell = leftCell.getLeftCell();
//        }
//        Case topCell = player.getCurCell().getTopCell();
//        double topRayParam = 0;
//        for (int i = 0; i < distance; i++) {
//            if (topCell.isWalkable()) {
//                topRayParam += 0.1; // 0.1 par 0.1
//            } else {
//                break ;
//            }
//            topCell = topCell.getTopCell();
//        }
//        Case bottomCell = player.getCurCell().getTopCell();
//        double bottomRayParam = 0;
//        for (int i = 0; i < distance; i++) {
//            if (bottomCell.isWalkable()) {
//                bottomRayParam += 0.1; // 0.1 par 0.1
//            } else {
//                break ;
//            }
//            bottomCell = bottomCell.getBottomCell();
//        }
//        //////////////////////////////////////
//
//        //////////////////////////////////////
//        // Bombs
//        //////////////////////////////////////
//        rightCell = player.getCurCell();
//        double bombsRightRayParam = 0.0;
//        for (int i = 0; i < distance + 1; i++) {
//            if (rightCell.hasBomb()) {
//                bombsRightRayParam = 1.0; // 0.1 par 0.1
//            } else if (!rightCell.isWalkable()) {
//                break;
//            }
//            rightCell = rightCell.getRightCell();
//        }
//        leftCell = player.getCurCell();
//        double bombsLeftRayParam = 0.0;
//        for (int i = 0; i < distance + 1; i++) {
//            if (leftCell.hasBomb()) {
//                bombsLeftRayParam = 1.0; // 0.1 par 0.1
//            } else if (!leftCell.isWalkable()) {
//                break;
//            }
//            leftCell = leftCell.getLeftCell();
//        }
//        topCell = player.getCurCell();
//        double bombsTopRayParam = 0;
//        for (int i = 0; i < distance + 1; i++) {
//            if (topCell.hasBomb()) {
//                bombsTopRayParam = 1.0; // 0.1 par 0.1
//            } else if (!topCell.isWalkable()) {
//                break;
//            }
//            topCell = topCell.getTopCell();
//        }
//        bottomCell = player.getCurCell();
//        double bombsBottomRayParam = 0;
//        for (int i = 0; i < distance + 1; i++) {
//            if (bottomCell.hasBomb()) {
//                bombsBottomRayParam = 1.0; // 0.1 par 0.1
//            } else if (!bottomCell.isWalkable()) {
//                break;
//            }
//            bottomCell = bottomCell.getBottomCell();
//        }
//        //////////////////////////////////////
//
//        visionField[0] = topRayParam;
//        visionField[1] = rightRayParam;
//        visionField[2] = bottomRayParam;
//        visionField[3] = leftRayParam;
//
//        visionField[4] = bombsTopRayParam;
//        visionField[5] = bombsRightRayParam;
//        visionField[6] = bombsBottomRayParam;
//        visionField[7] = bombsLeftRayParam;

        ArrayList<Bot> bots = new ArrayList<>(World.bots);
        ArrayList<Case> cells = World.map.getVisionField(player.getCurCell(), 3);

        ArrayList<Double> walkableMap = cells.stream().map((x) -> x.isWalkable() ? 1.0 : 0.0).collect(Collectors.toCollection(ArrayList::new));
        ArrayList<Double> bombMap = cells.stream().map((x) -> x.hasBomb() ? x.getBomb().getrange() / 100 : 0.0).collect(Collectors.toCollection(ArrayList::new));
        ArrayList<Double> destructibleObjectsMap = cells.stream().map((x) -> x.isWalkable() ? 1.0 : 0.0).collect(Collectors.toCollection(ArrayList::new));
        ArrayList<Double> itemsMap = cells.stream().map((x) -> x.hasItem() ? (x.getItem().getId() / 100) : 0.0).collect(Collectors.toCollection(ArrayList::new));
        ArrayList<Double> playersMap = cells.stream().map((x) -> {
            double count = bots.stream().filter((p) -> p != null && p.getPlayer().getCurCell().getId() == x.getId()).count();
            return count > 0 ? count / 1000 : 0;
        }).collect(Collectors.toCollection(ArrayList::new));

        ArrayList<Double> visionFields = new ArrayList<>();

        visionFields.addAll(walkableMap);
        visionFields.addAll(bombMap);
        visionFields.addAll(destructibleObjectsMap);
        visionFields.addAll(itemsMap);
        visionFields.addAll(playersMap);

//        ArrayList<Case> cells = World.map.getVisionField(player.getCurCell(), 3);
//        // Créer une matrice 10x10 pour stocker le champ de vision
//        double[][] visionField = new double[5][5];
//
//        // Définir les dimensions du champ de vision (le centre de la vision est la position du joueur)
//        int centerX = 2;  // Position centrale sur l'axe X
//        int centerY = 2;  // Position centrale sur l'axe Y
//
//        // Initialiser la matrice avec des valeurs par défaut, par exemple -1 pour indiquer une zone hors limite
//        for (int i = 0; i < 5; i++) {
//            for (int j = 0; j < 5; j++) {
//                visionField[i][j] = -1.0;  // -1 représente une case non définie ou hors de la carte
//            }
//        }
//
//        ArrayList<Bot> bots = new ArrayList<>(World.bots);
//        // Pour chaque case dans la liste cells, convertir en coordonnées par rapport au centre
//        for (Case c : cells) {
//            // Obtenir les coordonnées relatives à la position du joueur
//            double relativeX = c.getx() - player.getCurCell().getx();
//            double relativeY = c.gety() - player.getCurCell().gety();
//
//            // Vérifier si ces coordonnées sont dans les limites du tableau 10x10
//            double mapX = Math.floor((centerX + relativeX) % 5);
//            double mapY = Math.floor((centerY + relativeY) % 5);
//
//            if (mapX >= 0 && mapX < 10 && mapY >= 0 && mapY < 10) {
//                // Définir des valeurs spécifiques pour chaque type de case
//                if (!c.isWalkable() && !c.hasBomb()) {
//                    visionField[(int)mapX][(int)mapY] = c.getGroundId() / 10000.0;  // 1 pour un mur ou obstacle
//                } else if (c.hasBomb()) {
//                    visionField[(int)mapX][(int)mapY] = 2000 / 10000.0;  // 2 pour une bombe
//                } else if (c.hasItem()) {
//                    visionField[(int)mapX][(int)mapY] = 3000 / 10000.0;  // 3 pour case libre + item
//                } else {
//                    visionField[(int)mapX][(int)mapY] = 0;  // 0 pour une case libre
//                }
//            }
//        }
        return visionFields;
    }

    public void addToScore(double amount) {
        this.score += amount;
    }

    public double getPerformanceScore() {
        return this.score;
    }

    // Getter pour accéder au modèle pour l'entraînement
    public MultiLayerNetwork getModel() {
        return this.model;
    }
}
