#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
using namespace std;

// Structure to represent each task
struct Task {
    int cpu;
    int ram;
    int disk;
    int value;
};

// 4D Dynamic Programming for CPU, RAM, Disk constraints
int knapsack3D(int maxCPU, int maxRAM, int maxDisk, vector<Task>& tasks, vector<int>& selectedTasks) {
    int n = tasks.size();

    // 4D DP table: dp[i][c][r][d] = max value using first i tasks with capacities c, r, d
    vector<vector<vector<vector<int>>>> dp(n + 1,
        vector<vector<vector<int>>>(maxCPU + 1,
            vector<vector<int>>(maxRAM + 1,
                vector<int>(maxDisk + 1, 0))));

    // Fill DP table
    for (int i = 1; i <= n; ++i) {
        const Task& t = tasks[i - 1];
        for (int c = 0; c <= maxCPU; ++c) {
            for (int r = 0; r <= maxRAM; ++r) {
                for (int d = 0; d <= maxDisk; ++d) {
                    if (t.cpu <= c && t.ram <= r && t.disk <= d) {
                        dp[i][c][r][d] = max(
                            dp[i - 1][c][r][d],
                            t.value + dp[i - 1][c - t.cpu][r - t.ram][d - t.disk]
                        );
                    } else {
                        dp[i][c][r][d] = dp[i - 1][c][r][d];
                    }
                }
            }
        }
    }

    // Backtrack to find selected tasks
    int c = maxCPU, r = maxRAM, d = maxDisk;
    for (int i = n; i > 0; --i) {
        if (dp[i][c][r][d] != dp[i - 1][c][r][d]) {
            selectedTasks.push_back(i - 1); // Add task index
            c -= tasks[i - 1].cpu;
            r -= tasks[i - 1].ram;
            d -= tasks[i - 1].disk;
        }
    }

    // Sort selected tasks for consistent output
    sort(selectedTasks.begin(), selectedTasks.end());

    return dp[n][maxCPU][maxRAM][maxDisk]; // Final answer
}

int main() {
    ifstream cin("input.txt");
    ofstream cout("output.txt");

    int n;
    int maxCPU, maxRAM, maxDisk;

    // No prompts — just read the input
    cin >> n;
    cin >> maxCPU;
    cin >> maxRAM;
    cin >> maxDisk;

    vector<Task> tasks(n);

    for (int i = 0; i < n; ++i) {
        cin >> tasks[i].cpu >> tasks[i].ram >> tasks[i].disk >> tasks[i].value;
    }

    vector<int> selectedTasks;
    int maxValue = knapsack3D(maxCPU, maxRAM, maxDisk, tasks, selectedTasks);

    // Calculate used resources
    int usedCPU = 0, usedRAM = 0, usedDisk = 0;
    for (int idx : selectedTasks) {
        usedCPU += tasks[idx].cpu;
        usedRAM += tasks[idx].ram;
        usedDisk += tasks[idx].disk;
    }

    // Output results in a format that JavaScript can parse easily
    cout << "Maximum Total Value: " << maxValue << "\n";
    cout << "Selected Tasks (0-based indices): ";
    for (int i = 0; i < selectedTasks.size(); ++i) {
        cout << selectedTasks[i];
        if (i < selectedTasks.size() - 1) cout << " ";
    }
    cout << "\n";
    
    // Additional resource usage information
    cout << "Used Resources: CPU=" << usedCPU << " RAM=" << usedRAM << " DISK=" << usedDisk << "\n";
    cout << "Remaining Resources: CPU=" << (maxCPU - usedCPU) << " RAM=" << (maxRAM - usedRAM) << " DISK=" << (maxDisk - usedDisk) << "\n";

    return 0;
}