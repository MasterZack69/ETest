class EnglishTest {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.isTestCompleted = false;
        
        // DOM elements
        this.questionSection = document.getElementById('question-section');
        this.resultsSection = document.getElementById('results-section');
        this.progressFill = document.getElementById('progress-fill');
        this.currentQuestionSpan = document.getElementById('current-question');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.scoreValue = document.getElementById('score-value');
        this.incorrectAnswers = document.getElementById('incorrect-answers');
        this.retryBtn = document.getElementById('retry-btn');
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadQuestions();
            this.setupEventListeners();
            this.displayQuestion();
        } catch (error) {
            console.error('Failed to initialize test:', error);
            this.showError('Failed to load test questions. Please refresh the page.');
        }
    }
    
   async loadQuestions() {
    try {
        // Change this line to use your API endpoint
        const response = await fetch('/api/questions');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        this.questions = await response.json();
        
        if (!Array.isArray(this.questions) || this.questions.length === 0) {
            throw new Error('Invalid questions data');
        }
        
        // Initialize user answers array
        this.userAnswers = new Array(this.questions.length).fill(null);
        
    } catch (error) {
        console.error('Error loading questions:', error);
        throw error;
    }
}
 
    setupEventListeners() {
        this.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.retryBtn.addEventListener('click', () => this.restartTest());
        
        // Handle option selection
        this.optionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('option') || e.target.closest('.option')) {
                const option = e.target.classList.contains('option') ? e.target : e.target.closest('.option');
                this.selectOption(option);
            }
        });
    }
    
    displayQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showResults();
            return;
        }
        
        const question = this.questions[this.currentQuestionIndex];
        
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        this.currentQuestionSpan.textContent = this.currentQuestionIndex + 1 +"/" + this.questions.length;
        
        this.questionText.textContent = question.question;
        
        this.displayOptions(question.options);
        
        this.updateNavigationButtons();
        
        this.restoreSelection();
    }
    
    displayOptions(options) {
        this.optionsContainer.innerHTML = '';
        const optionLabels = ['A', 'B', 'C', 'D', 'E'];
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.dataset.index = index;
            
            optionElement.innerHTML = `
                <span class="option-label">${optionLabels[index]}.</span>
                <span class="option-text">${this.escapeHtml(option)}</span>
            `;
            
            this.optionsContainer.appendChild(optionElement);
        });
    }
    
    selectOption(optionElement) {
        // Remove previous selection
        this.optionsContainer.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selection to clicked option
        optionElement.classList.add('selected');
        
        // Store user's answer
        const selectedIndex = parseInt(optionElement.dataset.index);
        this.userAnswers[this.currentQuestionIndex] = selectedIndex;
    }
    
    restoreSelection() {
        const userAnswer = this.userAnswers[this.currentQuestionIndex];
        if (userAnswer !== null) {
            const optionElement = this.optionsContainer.querySelector(`[data-index="${userAnswer}"]`);
            if (optionElement) {
                optionElement.classList.add('selected');
            }
        }
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        } else {
            // Last question - show results
            this.showResults();
        }
    }
    
    updateNavigationButtons() {
        // Previous button
        this.prevBtn.disabled = this.currentQuestionIndex === 0;
        
        // Next button
        if (this.currentQuestionIndex === this.questions.length - 1) {
            this.nextBtn.textContent = 'Finish Test';
        } else {
            this.nextBtn.textContent = 'Next';
        }
    }
    
    calculateScore() {
        let correctAnswers = 0;
        const incorrectQuestions = [];
        
        this.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const correctAnswer = question.correctAnswer;
            
            if (userAnswer === correctAnswer) {
                correctAnswers++;
            } else {
                incorrectQuestions.push({
                    questionIndex: index,
                    question: question.question,
                    options: question.options,
                    userAnswer: userAnswer,
                    correctAnswer: correctAnswer,
                    explanation: question.explanation
                });
            }
        });
        
        return {
            score: correctAnswers,
            total: this.questions.length,
            incorrectQuestions: incorrectQuestions
        };
    }
    
    showResults() {
        this.isTestCompleted = true;
        const results = this.calculateScore();
        
        this.questionSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
        
        this.scoreValue.textContent = `${results.score}` + '/' + this.questions.length;
        
        this.displayIncorrectAnswers(results.incorrectQuestions);
    }
    
    displayIncorrectAnswers(incorrectQuestions) {
        this.incorrectAnswers.innerHTML = '';
        
        if (incorrectQuestions.length === 0) {
            this.incorrectAnswers.innerHTML = '<p style="text-align: center; color: var(--accent-color); font-size: 1.2rem;">🎉 Perfect Score! You got all questions correct!</p>';
            return;
        }
        
        const heading = document.createElement('h3');
        heading.textContent = `Questions You Got Wrong (${incorrectQuestions.length}):`;
        heading.style.marginBottom = '20px';
        heading.style.color = 'var(--error-color)';
        this.incorrectAnswers.appendChild(heading);
        
        const optionLabels = ['A', 'B', 'C', 'D', 'E'];
        
        incorrectQuestions.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'incorrect-item';
            
            const questionDiv = document.createElement('div');
            questionDiv.className = 'incorrect-question';
            questionDiv.innerHTML = `<strong>Question ${item.questionIndex + 1}:</strong><br>${this.escapeHtml(item.question)}`;
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'incorrect-options';
            
            item.options.forEach((option, optionIndex) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'incorrect-option';
                
                if (optionIndex === item.userAnswer && optionIndex === item.correctAnswer) {
                    optionDiv.classList.add('correct-answer');
                } else if (optionIndex === item.userAnswer) {
                    optionDiv.classList.add('user-answer');
                } else if (optionIndex === item.correctAnswer) {
                    optionDiv.classList.add('correct-answer');
                }
                
                optionDiv.innerHTML = `${optionLabels[optionIndex]}. ${this.escapeHtml(option)}`;
                optionsDiv.appendChild(optionDiv);
            });
            
            // Handle case where user didn't select any answer
            if (item.userAnswer === null) {
                const noAnswerDiv = document.createElement('div');
                noAnswerDiv.className = 'incorrect-option user-answer';
                noAnswerDiv.innerHTML = '<strong>You did not select any answer</strong>';
                optionsDiv.insertBefore(noAnswerDiv, optionsDiv.firstChild);
            }
            
            // Show explanation
            const explanationDiv = document.createElement('div');
            explanationDiv.className = 'explanation';
            explanationDiv.innerHTML = `<strong>Explanation:</strong><br>${this.escapeHtml(item.explanation)}`;
            
            itemDiv.appendChild(questionDiv);
            itemDiv.appendChild(optionsDiv);
            itemDiv.appendChild(explanationDiv);
            
            this.incorrectAnswers.appendChild(itemDiv);
        });
    }
    
    restartTest() {
        // Reset all data
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(this.questions.length).fill(null);
        this.isTestCompleted = false;
        
        this.questionSection.style.display = 'block';
        this.resultsSection.style.display = 'none';
        
        this.displayQuestion();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        this.questionText.innerHTML = `<div style="color: var(--error-color); text-align: center; padding: 20px;">${message}</div>`;
        this.optionsContainer.innerHTML = '';
        this.prevBtn.disabled = true;
        this.nextBtn.disabled = true;
    }
}

// Initialize the test when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnglishTest();
});
