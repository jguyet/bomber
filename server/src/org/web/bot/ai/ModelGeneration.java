package org.web.bot.ai;

import org.web.utils.Formulas;

import java.util.ArrayList;
import java.util.List;

public class ModelGeneration {


    // Liste de modèles dans la génération actuelle
    private List<BotAI> generation;
    private int population = 0;
    private double currentBestScore = 0;
    private BotAI currentBest = null;

    public ModelGeneration(int population) {
        this.generation = new ArrayList<>();
        this.population = population;
        // Générer la population initiale
        for (int i = 0; i < this.population; i++) {
            this.generation.add(new BotAI(i % 3));
        }
    }

    public void saveBestModel() {
        generation.sort((m1, m2) -> {
            return Double.compare(m2.getPerformanceScore(), m1.getPerformanceScore());
        });
//        if (currentBest != null) { // utilise the current best on the next also
//            generation.add(currentBest);
//        }
//        if (generation.get(0).getPerformanceScore() > currentBestScore) {
//            generation.get(0).saveModel();
//            currentBestScore = generation.get(0).getPerformanceScore();
//            currentBest = generation.get(0);
//        }
        generation.get(0).saveModel();
        System.out.println("[RESULT BEST MODEL] " + generation.get(0).getPerformanceScore());
    }

    // Méthode pour obtenir tous les modèles
    public List<BotAI> getGeneration() {
        return this.generation;
    }

    // Sélectionner les meilleurs modèles basés sur leur performance
    public List<BotAI> selectBestModels(int numBestModels) {
        // Placeholder : trier et sélectionner les meilleurs modèles basés sur des scores de performance
        // Implémente ici ta logique de scoring (évaluations de performance des bots)
        generation.sort((m1, m2) -> {
            return Double.compare(m2.getPerformanceScore(), m1.getPerformanceScore());
        });

        // Retourner les meilleurs modèles
        return new ArrayList<>(generation.subList(0, numBestModels));
    }

    public void saveGen(List<BotAI> bestModels) {
        int i = 0;
        for (BotAI bot: bestModels) {
            bot.saveGen("./gens/" + i + ".zip");
            i++;
        }
    }

    // Croiser et muter les modèles sélectionnés pour créer une nouvelle génération
    public void createNextGeneration(List<BotAI> bestModels) {
        generation.clear();

        // Générer la nouvelle génération en croisant les modèles sélectionnés
        for (int i = 0; i < this.population; i++) {
            BotAI parent1 = bestModels.get(Formulas.getRandomValue(1, bestModels.size()) - 1);
            BotAI parent2 = bestModels.get(Formulas.getRandomValue(1, bestModels.size()) - 1);
            // Croisement et mutation des modèles
            BotAI child = parent1.crossOver(parent2);
            child.mutate();
            generation.add(child);
        }
    }
}

