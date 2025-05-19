document.addEventListener('DOMContentLoaded', () => {
  const taskCountInput = document.getElementById('taskCount');
  const cpuInput = document.getElementById('cpu');
  const ramInput = document.getElementById('ram');
  const diskInput = document.getElementById('disk');
  const taskInputsContainer = document.getElementById('taskInputs');
  const resourceForm = document.getElementById('resourceForm');
  const outputDiv = document.getElementById('output');
  const taskInputTemplate = document.getElementById('taskInputTemplate');

  taskCountInput.value = 3;
  cpuInput.value = '';
  ramInput.value = '';
  diskInput.value = '';

  generateTaskInputs();

  taskCountInput.addEventListener('change', generateTaskInputs);

  function generateTaskInputs() {
    taskInputsContainer.innerHTML = '';
    let n = parseInt(taskCountInput.value);

    if (isNaN(n) || n <= 0) {
      showNotification('Please enter a valid number of tasks', 'error');
      return;
    }

    if (n > 25) {
      taskCountInput.value = 25;
      showNotification('Maximum 25 tasks allowed. Value set to 25.', 'warning');
      n = 25;
    }

    for (let i = 0; i < n; i++) {
      const taskElement = document.importNode(taskInputTemplate.content, true);
      taskElement.querySelector('h3').textContent = `Task ${i + 1}`;

      const inputs = taskElement.querySelectorAll('input');
      inputs.forEach(input => {
        const baseName = input.name;
        input.name = `${baseName}${i}`;
        input.id = `${baseName}${i}`;
        input.value = ''; // <== no random assignment
      });

      taskInputsContainer.appendChild(taskElement);
    }

    const taskInputs = document.querySelectorAll('.task-input');
    taskInputs.forEach((task, index) => {
      task.style.animationDelay = `${index * 0.05}s`;
    });
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('notification-hide');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  resourceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    outputDiv.innerHTML = `
      <div class="loading"></div>
      <p style="text-align: center; margin-top: 10px;">Processing allocation...</p>
    `;

    const numTasks = parseInt(taskCountInput.value);
    const cpu = cpuInput.value;
    const ram = ramInput.value;
    const disk = diskInput.value;

    const taskDivs = document.querySelectorAll('.task-input');
    let tasksStr = '';

    try {
      for (const taskDiv of taskDivs) {
        const cpuVal = taskDiv.querySelector('input[name^="cpu"]').value;
        const ramVal = taskDiv.querySelector('input[name^="ram"]').value;
        const diskVal = taskDiv.querySelector('input[name^="disk"]').value;
        const valueVal = taskDiv.querySelector('input[name^="value"]').value;
        tasksStr += `${cpuVal} ${ramVal} ${diskVal} ${valueVal}\n`;
      }

      const response = await fetch('/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          numTasks,
          cpu,
          ram,
          disk,
          tasks: tasksStr.trim(),
        }),
      });

      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
      const resultText = await response.text();

      const lines = resultText.trim().split('\n');
      if (lines.length >= 2) {
        const [maxLine, taskLine] = lines;
        outputDiv.innerHTML = `
          <h2>🧠 Allocation Result</h2>
          <p><strong>${maxLine}</strong></p>
          <p>${taskLine.replace('Selected Tasks', '<strong>Selected Tasks</strong>')}</p>
          <div class="action-buttons">
            <button id="downloadBtn" class="btn btn-small">📄 Export as PDF</button>
            <button id="newAllocationBtn" class="btn btn-small">🔄 New Allocation</button>
          </div>
        `;
      } else {
        outputDiv.innerHTML = `
          <h2>🧠 Allocation Result</h2>
          <p>${resultText}</p>
          <div class="action-buttons">
            <button id="downloadBtn" class="btn btn-small">📄 Export as PDF</button>
            <button id="newAllocationBtn" class="btn btn-small">🔄 New Allocation</button>
          </div>
        `;
      }

      outputDiv.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error:', error);
      outputDiv.innerHTML = `
        <h2>⚠️ Error</h2>
        <p>${error.message || 'Failed to communicate with server'}</p>
        <button id="tryAgainBtn" class="btn btn-small">🔄 Try Again</button>
      `;
    }
  });

  document.addEventListener('click', async (e) => {
    if (e.target.id === 'downloadBtn') {
      try {
        if (typeof window.jspdf === 'undefined') {
          showNotification('PDF generation library not loaded', 'error');
          return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setProperties({
          title: 'Cloud Resource Allocation Results',
          author: 'Cloud Resource Allocator',
        });

        const title = "Cloud Resource Allocation Results";

        const tempOutput = outputDiv.cloneNode(true);
        tempOutput.querySelectorAll('button').forEach(button => button.remove());

        let content = '';
        tempOutput.querySelectorAll('p').forEach(p => {
          content += p.innerText + '\n\n';
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(title, 20, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 27);

        doc.setFontSize(12);
        doc.text(`Available Resources: CPU: ${cpuInput.value}, RAM: ${ramInput.value}GB, Disk: ${diskInput.value}GB`, 20, 35);

        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(content.trim(), 170);
        doc.text(splitText, 20, 45);

        doc.save('cloud_resource_allocation.pdf');
        showNotification('PDF downloaded successfully', 'success');
      } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Failed to generate PDF', 'error');
      }
    }

    if (e.target.id === 'newAllocationBtn' || e.target.id === 'tryAgainBtn') {
      resourceForm.scrollIntoView({ behavior: 'smooth' });
    }
  });

  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background-color: rgba(29, 209, 161, 0.9);
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      opacity: 1;
      transform: translateY(0);
      transition: all 0.3s ease;
      max-width: 300px;
    }
    .notification.error { background-color: rgba(255, 71, 87, 0.9); }
    .notification.warning { background-color: rgba(255, 159, 67, 0.9); }
    .notification.info { background-color: rgba(84, 160, 255, 0.9); }
    .notification.success { background-color: rgba(29, 209, 161, 0.9); }
    .notification-hide {
      opacity: 0;
      transform: translateY(-20px);
    }
    .action-buttons {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
  `;
  document.head.appendChild(style);
});
