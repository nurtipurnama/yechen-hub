// Initialize Highcharts theme
Highcharts.theme = {
    chart: {
        backgroundColor: '#ffffff',
        style: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
    },
    title: {
        style: {
            fontSize: '16px',
            fontWeight: '500',
            color: '#333'
        }
    },
    colors: ['#4CAF50', '#F44336', '#2196F3', '#FF9800', '#9C27B0'],
    xAxis: {
        gridLineWidth: 0,
        lineColor: '#eee',
        tickColor: '#eee',
        labels: {
            style: {
                color: '#666'
            }
        }
    },
    yAxis: {
        gridLineColor: '#eee',
        labels: {
            style: {
                color: '#666'
            }
        }
    },
    plotOptions: {
        series: {
            shadow: false,
            borderWidth: 0
        }
    }
};

// Apply the theme
Highcharts.setOptions(Highcharts.theme);

// Global Variables
const currentDate = "2025-06-03 17:10:55";
const currentUser = "nurtipurnama";
let matches = {
    headToHead: [],
    team1Opponent: [],
    team2Opponent: []
};
let team1Name = 'Team 1';
let team2Name = 'Team 2';
let opponentName = 'Opponent';
let bettingLine = 0;
let bettingLineHistory = [];
let currentView = 'head-to-head';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Set current time and user
    document.getElementById('currentTime').textContent = currentDate;
    document.getElementById('currentUser').textContent = currentUser;
    
    // Initialize match inputs
    initializeMatchInputs();
    
    // Initialize charts
    updateCharts();

    // Set favicon
    setFavicon();

    // Initialize chart view buttons
    initializeChartViewButtons();
});

// Favicon setter
function setFavicon() {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'shortcut icon';
    link.href = 'images/logo.png';
    document.getElementsByTagName('head')[0].appendChild(link);
}

// Initialize Chart View Buttons
function initializeChartViewButtons() {
    document.querySelectorAll('.chart-selector-container .btn-group button').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.chart-selector-container .btn-group button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update current view and refresh charts
            currentView = button.getAttribute('data-view');
            updateCharts();
        });
    });
}

// Loading handlers
function showLoading() {
    hideLoading();
    
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.id = 'loadingSpinner';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
    
    // Safety timeout
    setTimeout(hideLoading, 5000);
}

function hideLoading() {
    const loading = document.querySelector('#loadingSpinner');
    if (loading) {
        loading.remove();
    }
}

// Initialize match inputs
function initializeMatchInputs() {
    // Initialize head to head matches
    document.getElementById('head-to-head-matches').innerHTML = createMatchInputRow('head-to-head');
    
    // Initialize team1 vs opponent matches
    document.getElementById('team1-opponent-matches').innerHTML = createMatchInputRow('team1-opponent');
    
    // Initialize team2 vs opponent matches
    document.getElementById('team2-opponent-matches').innerHTML = createMatchInputRow('team2-opponent');
}

// Create match input row
function createMatchInputRow(type) {
    let team1Label, team2Label;
    
    switch(type) {
        case 'head-to-head':
            team1Label = team1Name;
            team2Label = team2Name;
            break;
        case 'team1-opponent':
            team1Label = team1Name;
            team2Label = opponentName;
            break;
        case 'team2-opponent':
            team1Label = team2Name;
            team2Label = opponentName;
            break;
    }
    
    return `
        <div class="match-row mb-3">
            <div class="row g-2">
                <div class="col-6">
                    <input type="number" class="form-control" placeholder="${team1Label} Score" required>
                </div>
                <div class="col-6">
                    <input type="number" class="form-control" placeholder="${team2Label} Score" required>
                </div>
            </div>
        </div>
    `;
}

// Add Match Button Handlers
document.getElementById('add-head-to-head').onclick = () => {
    const container = document.getElementById('head-to-head-matches');
    container.insertAdjacentHTML('beforeend', createMatchInputRow('head-to-head'));
};

document.getElementById('add-team1-opponent').onclick = () => {
    const container = document.getElementById('team1-opponent-matches');
    container.insertAdjacentHTML('beforeend', createMatchInputRow('team1-opponent'));
};

document.getElementById('add-team2-opponent').onclick = () => {
    const container = document.getElementById('team2-opponent-matches');
    container.insertAdjacentHTML('beforeend', createMatchInputRow('team2-opponent'));
};

// Team Form Handler
document.getElementById('team-form').onsubmit = function(e) {
    e.preventDefault();
    const newTeam1 = document.getElementById('team1').value.trim();
    const newTeam2 = document.getElementById('team2').value.trim();
    const newOpponent = document.getElementById('opponent').value.trim();
    
    if (newTeam1 && newTeam2 && newOpponent) {
        team1Name = newTeam1;
        team2Name = newTeam2;
        opponentName = newOpponent;
        updateTeamLabels();
        showToast('Teams updated successfully', 'success');
        updateCharts();
    }
};

// Betting Line Form Handler
document.getElementById('betting-line-form').onsubmit = function(e) {
    e.preventDefault();
    const newLine = parseFloat(document.getElementById('betting-line').value);
    
    if (!isNaN(newLine)) {
        bettingLine = newLine;
        bettingLineHistory.push({
            value: newLine,
            timestamp: currentDate
        });
        document.getElementById('currentLine').textContent = newLine;
        showToast(`Betting line set to ${newLine}`, 'info');
        updateCharts();
    }
};

// Match Form Handler
document.getElementById('match-form').onsubmit = function(e) {
    e.preventDefault();
    showLoading();
    
    Promise.resolve()
        .then(() => {
            processMatchData();
            updateCharts();
            $('#dataInputModal').modal('hide');
            showToast('Analysis updated', 'success');
        })
        .catch(error => {
            console.error('Error processing match data:', error);
            showToast('Error updating analysis', 'error');
        })
        .finally(() => {
            hideLoading();
        });
};

// Reset Button Handler
document.getElementById('resetBtn').onclick = function() {
    if (confirm('Are you sure you want to reset all data?')) {
        showLoading();
        
        Promise.resolve()
            .then(() => {
                matches = {
                    headToHead: [],
                    team1Opponent: [],
                    team2Opponent: []
                };
                bettingLineHistory = [];
                initializeMatchInputs();
                updateCharts();
                showToast('All data has been reset', 'warning');
            })
            .catch(error => {
                console.error('Error resetting data:', error);
                showToast('Error resetting data', 'error');
            })
            .finally(() => {
                hideLoading();
            });
    }
};

// Download Button Handler
document.getElementById('downloadBtn').onclick = function() {
    const data = {
        metadata: {
            exportDate: currentDate,
            user: currentUser
        },
        teams: {
            team1: team1Name,
            team2: team2Name,
            opponent: opponentName
        },
        bettingLine,
        bettingLineHistory,
        matches,
        statistics: {
            headToHead: calculateStatistics('headToHead'),
            team1Opponent: calculateStatistics('team1Opponent'),
            team2Opponent: calculateStatistics('team2Opponent')
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match-analysis-${currentDate.split(' ')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully', 'success');
};

// Update Team Labels
function updateTeamLabels() {
    // Update head to head matches
    const headToHeadInputs = document.querySelectorAll('#head-to-head-matches input');
    headToHeadInputs.forEach((input, index) => {
        input.placeholder = `${index % 2 === 0 ? team1Name : team2Name} Score`;
    });
    
    // Update team1 vs opponent matches
    const team1OpponentInputs = document.querySelectorAll('#team1-opponent-matches input');
    team1OpponentInputs.forEach((input, index) => {
        input.placeholder = `${index % 2 === 0 ? team1Name : opponentName} Score`;
    });
    
    // Update team2 vs opponent matches
    const team2OpponentInputs = document.querySelectorAll('#team2-opponent-matches input');
    team2OpponentInputs.forEach((input, index) => {
        input.placeholder = `${index % 2 === 0 ? team2Name : opponentName} Score`;
    });
}

// Process Match Data
function processMatchData() {
    // Process head to head matches
    matches.headToHead = processMatchType('head-to-head-matches');
    
    // Process team1 vs opponent matches
    matches.team1Opponent = processMatchType('team1-opponent-matches');
    
    // Process team2 vs opponent matches
    matches.team2Opponent = processMatchType('team2-opponent-matches');
}

function processMatchType(containerId) {
    const matchArray = [];
    const inputs = document.querySelectorAll(`#${containerId} .match-row`);
    
    inputs.forEach(row => {
        const scores = row.querySelectorAll('input');
        const team1Score = parseInt(scores[0].value) || 0;
        const team2Score = parseInt(scores[1].value) || 0;
        
        matchArray.push({
            team1Score,
            team2Score,
            totalScore: team1Score + team2Score,
            timestamp: currentDate
        });
    });
    
    return matchArray;
}

// Update Charts and Statistics
function updateCharts() {
    createTotalScoreChart();
    createTeamPerformanceChart();
    updateStatistics();
    updateBettingRecommendation();
}

// Create Total Score Chart
function createTotalScoreChart() {
    let chartData;
    let chartTitle;
    
    switch(currentView) {
        case 'head-to-head':
            chartData = matches.headToHead;
            chartTitle = `${team1Name} vs ${team2Name} Total Scores`;
            break;
        case 'team1-opponent':
            chartData = matches.team1Opponent;
            chartTitle = `${team1Name} vs ${opponentName} Total Scores`;
            break;
        case 'team2-opponent':
            chartData = matches.team2Opponent;
            chartTitle = `${team2Name} vs ${opponentName} Total Scores`;
            break;
    }
    
    if (!chartData || chartData.length === 0) return;

    Highcharts.chart('total-score-chart', {
        chart: {
            type: 'column'
        },
        title: {
            text: chartTitle,
            align: 'left'
        },
        xAxis: {
            categories: chartData.map((_, i) => `Match ${i + 1}`)
        },
        yAxis: {
            title: {
                text: 'Total Score'
            },
            plotLines: [{
                color: '#666',
                value: bettingLine,
                width: 2,
                dashStyle: 'shortdash',
                label: {
                    text: `Line ${bettingLine}`,
                    align: 'right'
                }
            }]
        },
        series: [{
            name: 'Total Score',
            data: chartData.map(match => ({
                y: match.totalScore,
                color: match.totalScore > bettingLine ? '#4CAF50' : '#F44336'
            }))
        }]
    });
}

// Create Team Performance Chart
function createTeamPerformanceChart() {
    let chartData;
    let team1Label;
    let team2Label;
    
    switch(currentView) {
        case 'head-to-head':
            chartData = matches.headToHead;
            team1Label = team1Name;
            team2Label = team2Name;
            break;
        case 'team1-opponent':
            chartData = matches.team1Opponent;
            team1Label = team1Name;
            team2Label = opponentName;
            break;
        case 'team2-opponent':
            chartData = matches.team2Opponent;
            team1Label = team2Name;
            team2Label = opponentName;
            break;
    }
    
    if (!chartData || chartData.length === 0) return;

    Highcharts.chart('team-performance-chart', {
        chart: {
            type: 'line'
        },
        title: {
            text: 'Team Performance Comparison',
            align: 'left'
        },
        xAxis: {
            categories: chartData.map((_, i) => `Match ${i + 1}`)
        },
        yAxis: {
            title: {
                text: 'Score'
            }
        },
        series: [{
            name: team1Label,
            data: chartData.map(m => m.team1Score),
            color: '#2196F3'
        }, {
            name: team2Label,
            data: chartData.map(m => m.team2Score),
            color: '#FF5722'
        }]
    });
}

// Helper Functions
function calculateStatistics(matchType) {
    const matchData = matches[matchType];
    if (!matchData || matchData.length === 0) {
        return {
            totalMatches: 0,
            team1Average: '0.0',
            team2Average: '0.0',
            overPercentage: '0.0',
            team1Wins: 0,
            team2Wins: 0,
            draws: 0
        };
    }

    const team1Avg = (matchData.reduce((sum, m) => sum + m.team1Score, 0) / matchData.length).toFixed(1);
    const team2Avg = (matchData.reduce((sum, m) => sum + m.team2Score, 0) / matchData.length).toFixed(1);
    const overCount = matchData.filter(m => m.totalScore > bettingLine).length;
    const team1Wins = matchData.filter(m => m.team1Score > m.team2Score).length;
    const team2Wins = matchData.filter(m => m.team2Score > m.team1Score).length;
    const draws = matchData.filter(m => m.team1Score === m.team2Score).length;

    return {
        totalMatches: matchData.length,
        team1Average: team1Avg,
        team2Average: team2Avg,
        overPercentage: ((overCount / matchData.length) * 100).toFixed(1),
        team1Wins,
        team2Wins,
        draws
    };
}

function predictNextMatch(matchType) {
    const matchData = matches[matchType];
    if (!matchData || matchData.length === 0) return null;

    const recentMatches = matchData.slice(-3);
    const team1Avg = recentMatches.reduce((sum, m) => sum + m.team1Score, 0) / recentMatches.length;
    const team2Avg = recentMatches.reduce((sum, m) => sum + m.team2Score, 0) / recentMatches.length;
    const predictedTotal = Math.round(team1Avg + team2Avg);
    
    return {
        team1WinProb: team1Avg > team2Avg ? 60 : 40,
        team2WinProb: team2Avg > team1Avg ? 60 : 40,
        outcome: team1Avg > team2Avg ? 'Team 1 Win' : 'Team 2 Win',
        totalScore: predictedTotal
    };
}

// Update Statistics and Recommendations
function updateStatistics() {
    let stats;
    let team1Label;
    let team2Label;
    
    switch(currentView) {
        case 'head-to-head':
            stats = calculateStatistics('headToHead');
            team1Label = team1Name;
            team2Label = team2Name;
            break;
        case 'team1-opponent':
            stats = calculateStatistics('team1Opponent');
            team1Label = team1Name;
            team2Label = opponentName;
            break;
        case 'team2-opponent':
            stats = calculateStatistics('team2Opponent');
            team1Label = team2Name;
            team2Label = opponentName;
            break;
    }

    if (stats.totalMatches === 0) {
        document.getElementById('general-stats').innerHTML = '<p>No match data available</p>';
        document.getElementById('win-rates').innerHTML = '';
        document.getElementById('prediction-section').innerHTML = '';
        return;
    }

    // Update General Statistics
    document.getElementById('general-stats').innerHTML = `
        <h6>General Statistics</h6>
        <div class="stat-item">
            <span>Total Matches</span>
            <strong>${stats.totalMatches}</strong>
        </div>
        <div class="stat-item">
            <span>${team1Label} Average</span>
            <strong>${stats.team1Average}</strong>
        </div>
        <div class="stat-item">
            <span>${team2Label} Average</span>
            <strong>${stats.team2Average}</strong>
        </div>
        <div class="stat-item">
            <span>Over Percentage</span>
            <strong>${stats.overPercentage}%</strong>
        </div>
        <div class="stat-item">
            <span>Head-to-Head Record</span>
            <strong>${team1Label} ${stats.team1Wins}-${stats.draws}-${stats.team2Wins} ${team2Label}</strong>
        </div>
    `;

    // Update Win Rates
    const team1WinRate = ((stats.team1Wins / stats.totalMatches) * 100).toFixed(1);
    const team2WinRate = ((stats.team2Wins / stats.totalMatches) * 100).toFixed(1);
    const drawRate = ((stats.draws / stats.totalMatches) * 100).toFixed(1);

    document.getElementById('win-rates').innerHTML = `
        <h6>Win Rates</h6>
        <div class="progress mb-3">
            <div class="progress-bar bg-primary" style="width: ${team1WinRate}%">
                ${team1Label}: ${team1WinRate}%
            </div>
        </div>
        <div class="progress mb-3">
            <div class="progress-bar bg-danger" style="width: ${team2WinRate}%">
                ${team2Label}: ${team2WinRate}%
            </div>
        </div>
        <div class="progress mb-3">
            <div class="progress-bar bg-secondary" style="width: ${drawRate}%">
                Draws: ${drawRate}%
            </div>
        </div>
    `;

    // Update Prediction Section
    const prediction = predictNextMatch(currentView === 'head-to-head' ? 'headToHead' : 
                                     currentView === 'team1-opponent' ? 'team1Opponent' : 'team2Opponent');

    document.getElementById('prediction-section').innerHTML = `
        <div class="prediction-card">
            <h6>Next Match Prediction</h6>
            <div class="row">
                <div class="col-6">
                    <p class="mb-1">Predicted Winner</p>
                    <strong>${prediction.team1WinProb > prediction.team2WinProb ? team1Label : team2Label}</strong>
                    <span class="badge bg-info">
                        ${Math.max(prediction.team1WinProb, prediction.team2WinProb)}% probability
                    </span>
                </div>
                <div class="col-6">
                    <p class="mb-1">Predicted Total</p>
                    <strong>${prediction.totalScore}</strong>
                    <span class="badge ${prediction.totalScore > bettingLine ? 'bg-success' : 'bg-danger'}">
                        ${prediction.totalScore > bettingLine ? 'OVER' : 'UNDER'}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function updateBettingRecommendation() {
    let stats;
    let matchupLabel;
    
    switch(currentView) {
        case 'head-to-head':
            stats = calculateStatistics('headToHead');
            matchupLabel = `${team1Name} vs ${team2Name}`;
            break;
        case 'team1-opponent':
            stats = calculateStatistics('team1Opponent');
            matchupLabel = `${team1Name} vs ${opponentName}`;
            break;
        case 'team2-opponent':
            stats = calculateStatistics('team2Opponent');
            matchupLabel = `${team2Name} vs ${opponentName}`;
            break;
    }

    if (stats.totalMatches === 0) {
        document.getElementById('betting-recommendation').innerHTML = 
            '<p>Add match data to see betting recommendations</p>';
        return;
    }

    const overPercentage = parseFloat(stats.overPercentage);
    let confidence, confidenceClass, recommendation;

    if (overPercentage > 65) {
        confidence = 'High';
        confidenceClass = 'bg-success';
        recommendation = `OVER ${bettingLine}`;
    } else if (overPercentage < 35) {
        confidence = 'High';
        confidenceClass = 'bg-success';
        recommendation = `UNDER ${bettingLine}`;
    } else {
        confidence = 'Low';
        confidenceClass = 'bg-warning';
        recommendation = 'NO BET';
    }

    document.getElementById('betting-recommendation').innerHTML = `
        <div class="recommendation-card">
            <h6 class="mb-3">${matchupLabel}</h6>
            <div class="recommended-bet">
                <strong>${recommendation}</strong>
                <span class="badge ${confidenceClass}">${confidence} Confidence</span>
            </div>
            <div class="historical-results mt-3">
                <h6>Historical Results</h6>
                <div class="progress">
                    <div class="progress-bar bg-success" style="width: ${overPercentage}%">
                        Over: ${overPercentage}%
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast bg-${type} text-white`;
    toast.innerHTML = `
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    document.querySelector('.toast-container').appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
    bsToast.show();
    
    setTimeout(() => toast.remove(), 3300);
}