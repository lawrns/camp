import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ConversationList from './components/ConversationList';
import ConversationView from './components/ConversationView';
import CustomerDetails from './components/CustomerDetails';
import { Button } from './components/ui/button';

function App() {
  const [activeSection, setActiveSection] = useState('inbox');
  const [selectedConversation, setSelectedConversation] = useState('1');
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen bg-background flex">
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      <ConversationList 
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        isCollapsed={sidebarCollapsed}
      />
      
      <ConversationView 
        conversationId={selectedConversation}
        isCollapsed={sidebarCollapsed}
      />
      
      <CustomerDetails 
        isOpen={showCustomerDetails}
        onClose={() => setShowCustomerDetails(false)}
      />
      
      {/* Toggle Customer Details Button */}
      {!showCustomerDetails && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-4 right-4 z-50"
        >
          <Button
            onClick={() => setShowCustomerDetails(true)}
            className="shadow-lg"
          >
            Details
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default App;