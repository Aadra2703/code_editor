// Status bar functionality
document.addEventListener('DOMContentLoaded', () => {
    // Update time in status bar
    function updateTime() {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Create or update time element if needed
      let timeElement = document.querySelector('.status-time');
      if (!timeElement) {
        timeElement = document.createElement('span');
        timeElement.className = 'status-time';
        document.querySelector('.status-right').appendChild(timeElement);
      }
      
      timeElement.textContent = timeString;
    }
    
    // Initial call and set interval
    updateTime();
    setInterval(updateTime, 60000); // Update every minute
    
    // Language selector click handler (would open a dropdown in real app)
    document.querySelector('.language').addEventListener('click', () => {
      console.log('Language selector clicked');
      // Here you would show a dropdown with language options
    });
    
    // Encoding selector click handler
    document.querySelector('.encoding').addEventListener('click', () => {
      console.log('Encoding selector clicked');
      // Here you would show encoding options
    });
  });