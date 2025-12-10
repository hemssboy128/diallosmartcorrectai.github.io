// SmartCorrect - IA de correction automatique
document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const video = document.getElementById('cameraPreview');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const startCameraBtn = document.getElementById('startCameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const autoScanBtn = document.getElementById('autoScanBtn');
    const startVoiceBtn = document.getElementById('startVoiceBtn');
    const stopVoiceBtn = document.getElementById('stopVoiceBtn');
    const voiceResult = document.getElementById('voiceResult');
    const manualInput = document.getElementById('manualInput');
    const analyzeManualBtn = document.getElementById('analyzeManualBtn');
    const detectedTypeBadge = document.getElementById('detectedTypeBadge');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceText = document.getElementById('confidenceText');
    const analyzedQuestion = document.getElementById('analyzedQuestion');
    const aiSolution = document.getElementById('aiSolution');
    const correctionTime = document.getElementById('correctionTime');
    const stepList = document.getElementById('stepList');
    const explanationText = document.getElementById('explanationText');
    const alternativesList = document.getElementById('alternativesList');
    const validationResults = document.getElementById('validationResults');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    const aiInsightsBtn = document.getElementById('aiInsightsBtn');
    const scanOverlay = document.getElementById('scanOverlay');
    const voiceOverlay = document.getElementById('voiceOverlay');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const scanStatus = document.getElementById('scanStatus');
    const voiceLevel = document.getElementById('voiceLevel');
    const toast = document.getElementById('toast');
    const visualizer = document.getElementById('visualizer');
    const voiceStatus = document.getElementById('voiceStatus');
    
    // Variables d'état
    let stream = null;
    let isAutoScanning = false;
    let autoScanInterval = null;
    let recognition = null;
    let isListening = false;
    let analysisHistory = [];
    let currentDocumentType = 'auto';
    
    // Base de connaissances IA
    const aiKnowledgeBase = {
        // Types de documents avec mots-clés de détection
        documentTypes: {
            qcm: {
                keywords: ['QCM', 'question', 'choix', 'A)', 'B)', 'C)', 'D)', 'réponse', 'multiple', 'quiz'],
                icon: 'fa-check-square',
                color: '#ff6b6b'
            },
            algorithm: {
                keywords: ['algorithme', 'algo', 'complexité', 'O(', 'fonction', 'pseudo', 'code', 'boucle', 'si', 'pour'],
                icon: 'fa-code',
                color: '#4ecdc4'
            },
            webdev: {
                keywords: ['HTML', 'CSS', 'JavaScript', 'JS', 'web', 'site', 'page', 'balise', 'responsive', 'flexbox'],
                icon: 'fa-globe',
                color: '#45b7d1'
            },
            mobile: {
                keywords: ['mobile', 'React Native', 'Flutter', 'iOS', 'Android', 'app', 'application', 'widget'],
                icon: 'fa-mobile-alt',
                color: '#96c93d'
            },
            math: {
                keywords: ['calculer', 'résoudre', 'équation', 'formule', 'probabilité', 'statistique', 'maths', 'algèbre'],
                icon: 'fa-calculator',
                color: '#ffd93d'
            }
        },
        
        // Solutions prédéfinies pour types courants
        solutions: {
            qcm: {
                checkAnswer: function(question, answer) {
                    // Logique de correction QCM
                    const correctAnswers = {
                        'html semantic': 'C) header',
                        'css display': 'B) flex',
                        'js variable': 'A) let',
                        'algo complexity': 'B) O(n log n)',
                        'probability basic': 'C) 0.5'
                    };
                    
                    for (const [key, correct] of Object.entries(correctAnswers)) {
                        if (question.toLowerCase().includes(key)) {
                            return answer === correct ? 
                                { correct: true, feedback: 'Bonne réponse !' } :
                                { correct: false, feedback: `Réponse attendue: ${correct}` };
                        }
                    }
                    
                    return { correct: null, feedback: 'Question non reconnue' };
                }
            },
            
            algorithm: {
                solve: function(problem) {
                    const solutions = {
                        'factoriel': 'function factoriel(n) {\n  if (n <= 1) return 1;\n  return n * factoriel(n-1);\n}',
                        'fibonacci': 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}',
                        'tri': 'Tri rapide : O(n log n)\nTri bulle : O(n²)',
                        'recherche': 'Recherche binaire : O(log n)\nRecherche linéaire : O(n)'
                    };
                    
                    for (const [key, solution] of Object.entries(solutions)) {
                        if (problem.toLowerCase().includes(key)) {
                            return solution;
                        }
                    }
                    
                    return 'Solution algorithmique générique :\n1. Analyser le problème\n2. Déterminer la complexité\n3. Implémenter avec la meilleure approche';
                }
            },
            
            webdev: {
                solve: function(problem) {
                    if (problem.includes('HTML')) {
                        return `Solution HTML :
<header>
  <nav>
    <ul>
      <li><a href="#">Accueil</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
  </nav>
</header>`;
                    } else if (problem.includes('CSS')) {
                        return `Solution CSS :
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}`;
                    } else if (problem.includes('JavaScript') || problem.includes('JS')) {
                        return `Solution JavaScript :
// Gestion d'événement
document.addEventListener('DOMContentLoaded', function() {
  const button = document.querySelector('#monBouton');
  button.addEventListener('click', function() {
    alert('Bouton cliqué !');
  });
});

// Requête API
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur:', error);
  }
}`;
                    }
                    
                    return 'Solution développement web :\n1. Structurer le HTML sémantiquement\n2. Styler avec CSS moderne (Flexbox/Grid)\n3. Ajouter l\'interactivité avec JavaScript';
                }
            },
            
            math: {
                solve: function(problem) {
                    try {
                        // Extraire l'expression mathématique
                        const mathRegex = /(\d+[\+\-\*\/\^]\d+|\sqrt{\d+}|\d+!|sin|cos|tan|log|ln)/g;
                        const matches = problem.match(mathRegex);
                        
                        if (matches) {
                            let result = 'Calcul :\n';
                            matches.forEach(expr => {
                                try {
                                    const cleanExpr = expr
                                        .replace(/√/g, 'sqrt')
                                        .replace(/π/g, 'pi')
                                        .replace(/\^/g, '**');
                                    
                                    if (expr.includes('!')) {
                                        const num = parseInt(expr);
                                        let fact = 1;
                                        for (let i = 2; i <= num; i++) fact *= i;
                                        result += `${expr} = ${fact}\n`;
                                    } else {
                                        // Évaluer avec math.js
                                        const value = math.evaluate(cleanExpr);
                                        result += `${expr} = ${value}\n`;
                                    }
                                } catch (e) {
                                    result += `${expr} : Expression non évaluable\n`;
                                }
                            });
                            return result;
                        }
                        
                        // Probabilités
                        if (problem.includes('probabilité') || problem.includes('chance')) {
                            return `Solution probabilité :
P(A) = nombre cas favorables / nombre cas totaux
Exemple : dé à 6 faces
P(obtenir 6) = 1/6 ≈ 0.1667`;
                        }
                        
                        return 'Solution mathématique :\n1. Identifier le type de problème\n2. Appliquer la formule appropriée\n3. Vérifier le calcul';
                        
                    } catch (error) {
                        return 'Erreur dans le calcul mathématique';
                    }
                }
            }
        },
        
        // Reconnaissance de patterns
        patterns: {
            qcm: /(Q\d+|Question \d+).*?(A\)|B\)|C\)|D\)|R[ée]ponse.*)/is,
            algorithm: /(function|def|algorithme|complexit[ée]|O\(|boucle|si\s|pour\s)/i,
            webdev: /(<[^>]+>|HTML|CSS|JavaScript|JS|\.css|\.js|document\.|window\.)/i,
            mobile: /(React Native|Flutter|iOS|Android|Mobile|app\.|import.*flutter|import.*react)/i,
            math: /(calculer|r[ée]soudre|[+\-*/^=]|√|π|probabilit[ée]|statistique|math[ée]matique)/i
        }
    };
    
    // Initialisation
    initSmartCorrect();
    
    async function initSmartCorrect() {
        // Charger l'historique
        loadHistory();
        
        // Initialiser la reconnaissance vocale
        initVoiceRecognition();
        
        // Initialiser l'IA OCR
        await initOCR();
        
        // Configurer les événements
        setupEventListeners();
        
        // Mettre à jour l'interface
        updateDetectionUI('auto', 0);
        
        showToast('SmartCorrect IA activée !', 'success');
        speakAI('Prêt à analyser vos documents et questions.');
    }
    
    function initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'fr-FR';
            
            recognition.onstart = function() {
                isListening = true;
                voiceOverlay.classList.add('active');
                startVoiceBtn.disabled = true;
                stopVoiceBtn.disabled = false;
                updateVoiceStatus('Écoute en cours...');
                updateVoiceVisualizer(true);
            };
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                voiceResult.value = transcript;
                voiceOverlay.classList.remove('active');
                analyzeWithAI(transcript, 'voice');
            };
            
            recognition.onerror = function(event) {
                console.error('Erreur reconnaissance vocale:', event.error);
                voiceOverlay.classList.remove('active');
                showToast('Erreur de reconnaissance vocale', 'error');
                updateVoiceStatus('Erreur - Réessayez');
                updateVoiceVisualizer(false);
            };
            
            recognition.onend = function() {
                isListening = false;
                startVoiceBtn.disabled = false;
                stopVoiceBtn.disabled = true;
                updateVoiceStatus('Appuyez pour parler');
                updateVoiceVisualizer(false);
            };
            
        } else {
            startVoiceBtn.disabled = true;
            showToast('Reconnaissance vocale non supportée', 'warning');
        }
    }
    
    async function initOCR() {
        // Tesseract.js se chargera automatiquement
        showToast('Moteur OCR IA initialisé', 'info');
    }
    
    function setupEventListeners() {
        // Caméra
        startCameraBtn.addEventListener('click', startCamera);
        captureBtn.addEventListener('click', captureAndAnalyze);
        autoScanBtn.addEventListener('click', toggleAutoScan);
        
        // Voix
        startVoiceBtn.addEventListener('click', startVoiceRecognition);
        stopVoiceBtn.addEventListener('click', stopVoiceRecognition);
        
        // Manuel
        analyzeManualBtn.addEventListener('click', () => {
            if (manualInput.value.trim()) {
                analyzeWithAI(manualInput.value.trim(), 'manual');
            } else {
                showToast('Veuillez taper une question', 'warning');
            }
        });
        
        manualInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                analyzeManualBtn.click();
            }
        });
        
        // Détection auto
        document.querySelectorAll('.detection-item').forEach(item => {
            item.addEventListener('click', function() {
                setDetectionType(this.dataset.type);
            });
        });
        
        // Tabs détails
        document.querySelectorAll('.detail-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                switchDetailTab(tabId);
            });
        });
        
        // Filtres historique
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;
                filterHistory(filter);
            });
        });
        
        // Actions historique
        clearHistoryBtn.addEventListener('click', clearHistory);
        exportHistoryBtn.addEventListener('click', exportHistory);
        aiInsightsBtn.addEventListener('click', showAIInsights);
    }
    
    function setDetectionType(type) {
        currentDocumentType = type;
        
        // Mettre à jour l'UI
        document.querySelectorAll('.detection-item').forEach(item => {
            item.classList.toggle('active', item.dataset.type === type);
        });
        
        const typeInfo = aiKnowledgeBase.documentTypes[type] || 
                        { icon: 'fa-robot', color: '#00dbde' };
        
        detectedTypeBadge.innerHTML = `
            <span>${type === 'auto' ? 'Détection Auto' : type.toUpperCase()}</span>
            <i class="fas ${typeInfo.icon}"></i>
        `;
        detectedTypeBadge.style.borderLeftColor = typeInfo.color;
        
        showToast(`Mode ${type === 'auto' ? 'détection automatique' : type} activé`, 'info');
    }
    
    async function startCamera() {
        try {
            // Demander l'accès à la caméra
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Configurer la vidéo
            video.srcObject = stream;
            
            await new Promise(resolve => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });
            
            // Mettre à jour l'interface
            cameraPlaceholder.style.display = 'none';
            startCameraBtn.disabled = true;
            captureBtn.disabled = false;
            autoScanBtn.disabled = false;
            
            showToast('Caméra IA activée', 'success');
            speakAI('Caméra prête. Pointez vers votre document.');
            
        } catch (error) {
            console.error('Erreur caméra:', error);
            showToast('Impossible d\'accéder à la caméra', 'error');
            
            // Mode simulation pour le test
            simulateCamera();
            speakAI('Mode simulation activé. Utilisez la saisie manuelle ou vocale.');
        }
    }
    
    function simulateCamera() {
        cameraPlaceholder.innerHTML = `
            <i class="fas fa-camera-slash"></i>
            <p>Mode simulation IA</p>
            <small>Utilisez la voix ou la saisie manuelle</small>
        `;
        
        startCameraBtn.disabled = true;
        captureBtn.disabled = false;
        autoScanBtn.disabled = false;
        
        showToast('Mode simulation IA activé', 'warning');
    }
    
    function toggleAutoScan() {
        if (isAutoScanning) {
            stopAutoScan();
        } else {
            startAutoScan();
        }
    }
    
    function startAutoScan() {
        if (!stream) {
            showToast('Activez d\'abord la caméra', 'warning');
            return;
        }
        
        isAutoScanning = true;
        autoScanBtn.innerHTML = '<i class="fas fa-robot"></i> Auto-Scan: ON';
        autoScanBtn.classList.add('active');
        
        // Scanner toutes les 2 secondes
        autoScanInterval = setInterval(() => {
            captureAndAnalyze(true);
        }, 2000);
        
        showToast('Auto-Scan IA activé', 'success');
        speakAI('Scan automatique activé. L\'IA analysera automatiquement.');
    }
    
    function stopAutoScan() {
        isAutoScanning = false;
        autoScanBtn.innerHTML = '<i class="fas fa-robot"></i> Auto-Scan';
        autoScanBtn.classList.remove('active');
        
        if (autoScanInterval) {
            clearInterval(autoScanInterval);
            autoScanInterval = null;
        }
        
        showToast('Auto-Scan désactivé', 'info');
    }
    
    async function captureAndAnalyze(isAuto = false) {
        if (!stream && !isAuto) {
            showToast('Activez la caméra d\'abord', 'warning');
            return;
        }
        
        // Afficher l'overlay d'analyse
        scanOverlay.classList.add('active');
        captureBtn.disabled = true;
        
        try {
            const startTime = Date.now();
            
            // Simuler la progression pour la démo
            simulateProgress();
            
            let text;
            if (stream) {
                // Capturer depuis la caméra
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                
                // OCR avec Tesseract
                const worker = await Tesseract.createWorker();
                await worker.loadLanguage('fra+eng');
                await worker.initialize('fra+eng');
                
                const { data: { text: ocrText } } = await worker.recognize(canvas.toDataURL());
                await worker.terminate();
                
                text = ocrText;
            } else {
                // Mode simulation
                text = getSimulatedDocument(currentDocumentType);
            }
            
            // Analyser avec l'IA
            const analysis = analyzeWithAI(text, 'scan');
            
            const endTime = Date.now();
            correctionTime.querySelector('span').textContent = `${endTime - startTime} ms`;
            
            // Cacher l'overlay
            setTimeout(() => {
                scanOverlay.classList.remove('active');
                captureBtn.disabled = false;
                
                if (!isAuto) {
                    showToast('Analyse IA terminée !', 'success');
                    speakAI('Analyse terminée. Solution affichée.');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Erreur analyse:', error);
            scanOverlay.classList.remove('active');
            captureBtn.disabled = false;
            showToast('Erreur d\'analyse IA', 'error');
        }
    }
    
    function simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            if (progress <= 30) {
                scanStatus.textContent = 'Détection du type de document...';
            } else if (progress <= 60) {
                scanStatus.textContent = 'Analyse du contenu...';
            } else if (progress <= 90) {
                scanStatus.textContent = 'Génération de la solution...';
            }
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 100);
    }
    
    function getSimulatedDocument(type) {
        const documents = {
            qcm: `Q1: Quelle balise HTML est sémantique ?
A) div
B) span
C) header
D) table

Réponse: C

Q2: Complexité du tri rapide ?
A) O(n)
B) O(n log n)
C) O(n²)
D) O(log n)

Réponse: B`,
            
            algorithm: `Écrire un algorithme pour calculer le factoriel d'un nombre n.
La complexité doit être O(n).

fonction factoriel(n):
    si n <= 1:
        retourner 1
    retourner n * factoriel(n-1)`,
            
            webdev: `Créer un bouton en HTML/CSS/JS qui change de couleur au clic.

HTML:
<button id="colorButton">Changer couleur</button>

CSS:
button {
    padding: 10px 20px;
    background: blue;
    color: white;
}`,
            
            mobile: `Développer une application React Native avec un composant bouton.

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

const AppButton = ({ title, onPress }) => (
    <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
    </TouchableOpacity>
);`,
            
            math: `Calculer:
1) 2 + 3 * 5
2) √16
3) Probabilité d'obtenir un 6 avec un dé
4) Factoriel de 5`
        };
        
        return documents[type] || documents.qcm;
    }
    
    function startVoiceRecognition() {
        if (recognition && !isListening) {
            recognition.start();
            updateVoiceVisualizer(true);
        }
    }
    
    function stopVoiceRecognition() {
        if (recognition && isListening) {
            recognition.stop();
            updateVoiceVisualizer(false);
        }
    }
    
    function updateVoiceVisualizer(isActive) {
        visualizer.innerHTML = '';
        voiceStatus.innerHTML = isActive ? 
            `<i class="fas fa-microphone"></i><span>Écoute en cours...</span>` :
            `<i class="fas fa-microphone-slash"></i><span>Appuyez pour parler</span>`;
        
        if (isActive) {
            // Créer des barres d'animation
            for (let i = 0; i < 20; i++) {
                const bar = document.createElement('div');
                bar.style.width = '4px';
                bar.style.height = '100%';
                bar.style.background = 'linear-gradient(to top, #ff416c, #ff4b2b)';
                bar.style.animation = `wave ${1 + Math.random()}s infinite ease-in-out`;
                bar.style.animationDelay = `${i * 0.05}s`;
                visualizer.appendChild(bar);
            }
            
            // Animation du niveau sonore
            const updateLevel = () => {
                if (!isListening) return;
                const level = Math.random() * 100;
                voiceLevel.querySelector('.level-bars').style.transform = `scaleX(${level / 100})`;
                setTimeout(updateLevel, 100);
            };
            updateLevel();
        }
    }
    
    function updateVoiceStatus(text) {
        if (voiceStatus) {
            voiceStatus.querySelector('span').textContent = text;
        }
    }
    
    function analyzeWithAI(input, source) {
        if (!input.trim()) {
            showToast('Aucun contenu à analyser', 'warning');
            return;
        }
        
        // Afficher la question
        analyzedQuestion.textContent = input;
        
        // Détecter automatiquement le type
        const detection = detectDocumentType(input);
        const docType = currentDocumentType === 'auto' ? detection.type : currentDocumentType;
        
        // Mettre à jour l'UI de détection
        updateDetectionUI(docType, detection.confidence);
        
        // Générer la solution IA
        const solution = generateAISolution(input, docType);
        
        // Afficher la solution
        displaySolution(solution, docType);
        
        // Générer les détails
        generateDetails(input, solution, docType);
        
        // Sauvegarder dans l'historique
        saveToHistory(input, solution, docType, source);
        
        return { type: docType, solution: solution };
    }
    
    function detectDocumentType(text) {
        const lowerText = text.toLowerCase();
        let bestMatch = { type: 'general', confidence: 0 };
        
        for (const [type, config] of Object.entries(aiKnowledgeBase.patterns)) {
            const match = lowerText.match(config);
            if (match) {
                const confidence = Math.min(100, match[0].length / lowerText.length * 200);
                if (confidence > bestMatch.confidence) {
                    bestMatch = { type: type, confidence: confidence };
                }
            }
        }
        
        // Vérifier aussi par mots-clés
        for (const [type, data] of Object.entries(aiKnowledgeBase.documentTypes)) {
            const keywordCount = data.keywords.filter(keyword => 
                lowerText.includes(keyword.toLowerCase())
            ).length;
            
            if (keywordCount > 0) {
                const confidence = Math.min(100, keywordCount * 20);
                if (confidence > bestMatch.confidence) {
                    bestMatch = { type: type, confidence: confidence };
                }
            }
        }
        
        return bestMatch;
    }
    
    function updateDetectionUI(type, confidence) {
        const typeInfo = aiKnowledgeBase.documentTypes[type] || 
                        { icon: 'fa-robot', color: '#00dbde', name: type };
        
        detectedTypeBadge.innerHTML = `
            <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <i class="fas ${typeInfo.icon}"></i>
        `;
        detectedTypeBadge.style.borderLeftColor = typeInfo.color;
        
        confidenceFill.style.width = `${confidence}%`;
        confidenceText.textContent = `${Math.round(confidence)}%`;
    }
    
    function generateAISolution(input, type) {
        const solver = aiKnowledgeBase.solutions[type];
        
        if (solver) {
            if (type === 'qcm') {
                // Pour les QCM, extraire la réponse et vérifier
                const answerMatch = input.match(/R[ée]ponse.*?([A-D])/i);
                if (answerMatch) {
                    const answer = answerMatch[1];
                    return solver.checkAnswer(input, answer);
                }
            }
            return solver.solve(input);
        }
        
        // Solution générique si type non reconnu
        return `Solution IA (type: ${type}) :
1. J'ai analysé votre question
2. Type détecté: ${type}
3. Voici une réponse adaptée

Pour une analyse plus précise, précisez le type de problème.`;
    }
    
    function displaySolution(solution, type) {
        if (typeof solution === 'object' && solution.feedback) {
            // Pour les QCM
            aiSolution.innerHTML = `
                <div class="solution-feedback ${solution.correct ? 'correct' : 'incorrect'}">
                    <h4><i class="fas fa-${solution.correct ? 'check' : 'times'}"></i> 
                        ${solution.correct ? 'CORRECT' : 'INCORRECT'}</h4>
                    <p>${solution.feedback}</p>
                </div>
            `;
        } else {
            // Pour les autres types
            aiSolution.innerHTML = `
                <div class="solution-content">
                    <pre>${solution}</pre>
                    <div class="solution-meta">
                        <span><i class="fas ${aiKnowledgeBase.documentTypes[type]?.icon || 'fa-robot'}"></i> ${type.toUpperCase()}</span>
                        <span><i class="fas fa-bolt"></i> Solution IA</span>
                    </div>
                </div>
            `;
        }
    }
    
    function generateDetails(input, solution, type) {
        // Étapes
        const steps = [
            '1. Analyse du texte et détection du type',
            '2. Identification des éléments clés',
            '3. Application des règles correspondantes',
            '4. Génération de la solution',
            '5. Validation automatique'
        ];
        
        stepList.innerHTML = steps.map(step => 
            `<div class="step-item">${step}</div>`
        ).join('');
        
        // Explication
        explanationText.innerHTML = `
            <p>L'IA a détecté un problème de type <strong>${type}</strong>.</p>
            <p>Le système a analysé les mots-clés et patterns pour déterminer la meilleure approche.</p>
            <p>La solution proposée est basée sur les règles établies dans la base de connaissances IA.</p>
        `;
        
        // Alternatives
        const alternatives = getAlternativeSolutions(type);
        alternativesList.innerHTML = alternatives.map(alt => 
            `<div class="alternative-item">
                <h5>${alt.title}</h5>
                <p>${alt.description}</p>
            </div>`
        ).join('');
        
        // Validation
        validationResults.innerHTML = `
            <div class="validation-item valid">
                <i class="fas fa-check"></i>
                <span>Type détecté avec succès</span>
            </div>
            <div class="validation-item valid">
                <i class="fas fa-check"></i>
                <span>Solution générée automatiquement</span>
            </div>
            <div class="validation-item ${typeof solution === 'object' && solution.correct !== null ? 'valid' : 'warning'}">
                <i class="fas ${typeof solution === 'object' && solution.correct !== null ? 'fa-check' : 'fa-exclamation'}"></i>
                <span>${typeof solution === 'object' && solution.correct !== null ? 'Validation possible' : 'Validation manuelle requise'}</span>
            </div>
        `;
    }
    
    function getAlternativeSolutions(type) {
        const alternatives = {
            qcm: [
                { title: 'Méthode par élimination', description: 'Éliminez les réponses manifestement fausses' },
                { title: 'Analyse sémantique', description: 'Comparez les termes techniques' }
            ],
            algorithm: [
                { title: 'Approche itérative', description: 'Utilisez des boucles au lieu de la récursivité' },
                { title: 'Optimisation mémoire', description: 'Réduisez l\'utilisation de la mémoire' }
            ],
            webdev: [
                { title: 'Framework moderne', description: 'Utilisez React, Vue ou Angular' },
                { title: 'Approche mobile-first', description: 'Commencez par le design mobile' }
            ],
            math: [
                { title: 'Vérification numérique', description: 'Testez avec des valeurs concrètes' },
                { title: 'Approche graphique', description: 'Représentez le problème visuellement' }
            ]
        };
        
        return alternatives[type] || [
            { title: 'Approche générale', description: 'Divisez le problème en sous-problèmes' },
            { title: 'Recherche approfondie', description: 'Consultez la documentation spécifique' }
        ];
    }
    
    function saveToHistory(input, solution, type, source) {
        const historyItem = {
            id: Date.now(),
            input: input.substring(0, 200),
            solution: typeof solution === 'string' ? solution : solution.feedback,
            type: type,
            source: source,
            timestamp: new Date().toLocaleString('fr-FR'),
            date: new Date().toISOString()
        };
        
        analysisHistory.unshift(historyItem);
        
        // Limiter à 50 éléments
        if (analysisHistory.length > 50) {
            analysisHistory = analysisHistory.slice(0, 50);
        }
        
        saveHistory();
        updateHistoryDisplay();
    }
    
    function updateHistoryDisplay() {
        if (analysisHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-history"></i>
                    <p>Votre historique d'analyses apparaîtra ici</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        analysisHistory.slice(0, 10).forEach(item => {
            const typeInfo = aiKnowledgeBase.documentTypes[item.type] || 
                            { icon: 'fa-robot', color: '#00dbde' };
            
            html += `
                <div class="history-item" style="border-left-color: ${typeInfo.color}">
                    <div class="history-header">
                        <i class="fas ${typeInfo.icon}"></i>
                        <span class="history-type">${item.type.toUpperCase()}</span>
                        <span class="history-source">${item.source}</span>
                    </div>
                    <div class="history-content">${item.input.substring(0, 80)}...</div>
                    <div class="history-time">${item.timestamp}</div>
                </div>
            `;
        });
        
        historyList.innerHTML = html;
    }
    
    function filterHistory(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        if (filter === 'all') {
            updateHistoryDisplay();
            return;
        }
        
        const filtered = analysisHistory.filter(item => item.type === filter);
        
        if (filtered.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-filter"></i>
                    <p>Aucune analyse de type ${filter}</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        filtered.slice(0, 10).forEach(item => {
            const typeInfo = aiKnowledgeBase.documentTypes[item.type] || 
                            { icon: 'fa-robot', color: '#00dbde' };
            
            html += `
                <div class="history-item" style="border-left-color: ${typeInfo.color}">
                    <div class="history-header">
                        <i class="fas ${typeInfo.icon}"></i>
                        <span class="history-type">${item.type.toUpperCase()}</span>
                        <span class="history-source">${item.source}</span>
                    </div>
                    <div class="history-content">${item.input.substring(0, 80)}...</div>
                    <div class="history-time">${item.timestamp}</div>
                </div>
            `;
        });
        
        historyList.innerHTML = html;
    }
    
    function saveHistory() {
        try {
            localStorage.setItem('smartCorrectHistory', JSON.stringify(analysisHistory));
        } catch (e) {
            console.error('Erreur sauvegarde historique:', e);
        }
    }
    
    function loadHistory() {
        try {
            const saved = localStorage.getItem('smartCorrectHistory');
            if (saved) {
                analysisHistory = JSON.parse(saved);
                updateHistoryDisplay();
            }
        } catch (e) {
            console.error('Erreur chargement historique:', e);
        }
    }
    
    function clearHistory() {
        if (analysisHistory.length === 0) {
            showToast('Historique déjà vide', 'info');
            return;
        }
        
        if (confirm('Voulez-vous vraiment effacer tout l\'historique IA ?')) {
            analysisHistory = [];
            localStorage.removeItem('smartCorrectHistory');
            updateHistoryDisplay();
            showToast('Historique IA effacé', 'success');
        }
    }
    
    function exportHistory() {
        if (analysisHistory.length === 0) {
            showToast('Aucune donnée à exporter', 'warning');
            return;
        }
        
        let csv = 'Date,Type,Source,Question,Solution\n';
        
        analysisHistory.forEach(item => {
            csv += `"${item.timestamp}","${item.type}","${item.source}","${item.input.replace(/"/g, '""')}","${(typeof item.solution === 'string' ? item.solution : item.solution.feedback).replace(/"/g, '""')}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartcorrect-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Historique exporté en CSV', 'success');
    }
    
    function showAIInsights() {
        if (analysisHistory.length === 0) {
            showToast('Pas assez de données pour les insights', 'info');
            return;
        }
        
        // Calculer les statistiques
        const stats = {
            total: analysisHistory.length,
            byType: {},
            bySource: {},
            avgLength: 0
        };
        
        let totalLength = 0;
        
        analysisHistory.forEach(item => {
            // Par type
            stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
            
            // Par source
            stats.bySource[item.source] = (stats.bySource[item.source] || 0) + 1;
            
            // Longueur moyenne
            totalLength += item.input.length;
        });
        
        stats.avgLength = Math.round(totalLength / analysisHistory.length);
        
        // Afficher les insights
        const insights = `
            <h4>Insights IA</h4>
            <div class="insight-item">
                <i class="fas fa-chart-bar"></i>
                <span>Total analyses: ${stats.total}</span>
            </div>
            <div class="insight-item">
                <i class="fas fa-code"></i>
                <span>Types les plus fréquents:</span>
                <div class="insight-tags">
                    ${Object.entries(stats.byType).map(([type, count]) => 
                        `<span class="tag">${type}: ${count}</span>`
                    ).join('')}
                </div>
            </div>
            <div class="insight-item">
                <i class="fas fa-microphone"></i>
                <span>Sources: ${Object.entries(stats.bySource).map(([source, count]) => 
                    `${source}: ${count}`
                ).join(', ')}</span>
            </div>
            <div class="insight-item">
                <i class="fas fa-ruler"></i>
                <span>Longueur moyenne: ${stats.avgLength} caractères</span>
            </div>
        `;
        
        // Afficher dans une modal ou remplacer le contenu
        aiSolution.innerHTML = `
            <div class="insights-container">
                ${insights}
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class="fas fa-sync"></i> Revenir aux analyses
                </button>
            </div>
        `;
        
        showToast('Insights IA générés', 'info');
    }
    
    function switchDetailTab(tabId) {
        document.querySelectorAll('.detail-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        document.querySelectorAll('.detail-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId + 'Content');
        });
    }
    
    function speakAI(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
    }
    
    function showToast(message, type = 'info') {
        const colors = {
            success: 'linear-gradient(45deg, #00b09b, #96c93d)',
            error: 'linear-gradient(45deg, #ff416c, #ff4b2b)',
            warning: 'linear-gradient(45deg, #ff9966, #ff5e62)',
            info: 'linear-gradient(45deg, #00dbde, #fc00ff)'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
        toast.style.background = colors[type] || colors.info;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // API publique pour le test
    window.SmartCorrect = {
        testVoice: function() {
            voiceResult.value = "Calculer 2 plus 3 fois 5";
            analyzeWithAI("Calculer 2 plus 3 fois 5", 'voice');
        },
        
        testQCM: function() {
            manualInput.value = "Q1: Quelle est la complexité du tri rapide ?\nA) O(n)\nB) O(n log n)\nC) O(n²)\nD) O(log n)\n\nRéponse: B";
            analyzeManualBtn.click();
        },
        
        testAlgorithm: function() {
            manualInput.value = "Écrire un algorithme pour calculer le factoriel d'un nombre n de manière récursive.";
            analyzeManualBtn.click();
        },
        
        testWebDev: function() {
            manualInput.value = "Créer un bouton HTML qui change de couleur au clic avec JavaScript.";
            analyzeManualBtn.click();
        },
        
        testMath: function() {
            manualInput.value = "Calculer √16 + sin(π/2) * 5";
            analyzeManualBtn.click();
        },
        
        clearAll: function() {
            manualInput.value = '';
            voiceResult.value = '';
            analyzedQuestion.textContent = 'Aucune question analysée';
            aiSolution.innerHTML = '<div class="empty-solution"><i class="fas fa-robot"></i><p>La solution IA apparaîtra ici</p></div>';
            showToast('Interface réinitialisée', 'info');
        }
    };
    
    // Démarrer avec un exemple
    setTimeout(() => {
        if (analysisHistory.length === 0) {
            SmartCorrect.testQCM();
        }
    }, 1000);
});