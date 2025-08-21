/**
 * Database utility for managing highscores in CSV format
 * Note: This is a placeholder implementation for future file system access
 * Currently uses localStorage, but can be extended to use File System Access API
 */

export class Database {
    constructor() {
        this.storageKey = 'suika-game-highscores';
        this.csvHeaders = ['timestamp', 'score', 'duration', 'ballsUsed'];
    }
    
    /**
     * Save a new highscore entry
     */
    async saveScore(scoreData) {
        try {
            const scores = await this.getScores();
            const newEntry = {
                timestamp: new Date().toISOString(),
                score: scoreData.score,
                duration: scoreData.duration || 0,
                ballsUsed: scoreData.ballsUsed || 0
            };
            
            scores.push(newEntry);
            
            // Sort by score (highest first)
            scores.sort((a, b) => b.score - a.score);
            
            // Keep only top 100 scores
            const topScores = scores.slice(0, 100);
            
            await this.saveScores(topScores);
            return newEntry;
        } catch (error) {
            console.error('Failed to save score:', error);
            throw error;
        }
    }
    
    /**
     * Get all saved scores
     */
    async getScores() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load scores:', error);
            return [];
        }
    }
    
    /**
     * Get the highest score
     */
    async getHighScore() {
        const scores = await this.getScores();
        return scores.length > 0 ? scores[0].score : 0;
    }
    
    /**
     * Get top N scores
     */
    async getTopScores(limit = 10) {
        const scores = await this.getScores();
        return scores.slice(0, limit);
    }
    
    /**
     * Save scores array to storage
     */
    async saveScores(scores) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(scores));
        } catch (error) {
            console.error('Failed to save scores:', error);
            throw error;
        }
    }
    
    /**
     * Export scores to CSV format
     */
    async exportToCSV() {
        try {
            const scores = await this.getScores();
            
            // Create CSV content
            const csvContent = [
                this.csvHeaders.join(','),
                ...scores.map(score => [
                    score.timestamp,
                    score.score,
                    score.duration,
                    score.ballsUsed
                ].join(','))
            ].join('\n');
            
            return csvContent;
        } catch (error) {
            console.error('Failed to export CSV:', error);
            throw error;
        }
    }
    
    /**
     * Download CSV file (browser only)
     */
    async downloadCSV(filename = 'suika-highscores.csv') {
        try {
            const csvContent = await this.exportToCSV();
            
            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download CSV:', error);
            throw error;
        }
    }
    
    /**
     * Import scores from CSV content
     */
    async importFromCSV(csvContent) {
        try {
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',');
            
            // Validate headers
            if (!this.csvHeaders.every(header => headers.includes(header))) {
                throw new Error('Invalid CSV format: missing required headers');
            }
            
            const scores = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const values = line.split(',');
                const scoreEntry = {
                    timestamp: values[0],
                    score: parseInt(values[1]) || 0,
                    duration: parseInt(values[2]) || 0,
                    ballsUsed: parseInt(values[3]) || 0
                };
                
                scores.push(scoreEntry);
            }
            
            // Merge with existing scores and save
            const existingScores = await this.getScores();
            const allScores = [...existingScores, ...scores];
            
            // Remove duplicates and sort
            const uniqueScores = allScores.filter((score, index, self) => 
                index === self.findIndex(s => s.timestamp === score.timestamp)
            );
            
            uniqueScores.sort((a, b) => b.score - a.score);
            const topScores = uniqueScores.slice(0, 100);
            
            await this.saveScores(topScores);
            return topScores.length;
        } catch (error) {
            console.error('Failed to import CSV:', error);
            throw error;
        }
    }
    
    /**
     * Clear all scores
     */
    async clearScores() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error('Failed to clear scores:', error);
            throw error;
        }
    }
    
    /**
     * Get statistics about saved scores
     */
    async getStatistics() {
        try {
            const scores = await this.getScores();
            
            if (scores.length === 0) {
                return {
                    totalGames: 0,
                    highestScore: 0,
                    averageScore: 0,
                    totalDuration: 0
                };
            }
            
            const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
            const totalDuration = scores.reduce((sum, score) => sum + score.duration, 0);
            
            return {
                totalGames: scores.length,
                highestScore: Math.max(...scores.map(s => s.score)),
                averageScore: Math.round(totalScore / scores.length),
                totalDuration: totalDuration
            };
        } catch (error) {
            console.error('Failed to get statistics:', error);
            return {
                totalGames: 0,
                highestScore: 0,
                averageScore: 0,
                totalDuration: 0
            };
        }
    }
}