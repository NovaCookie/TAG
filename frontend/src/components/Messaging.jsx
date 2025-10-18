import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import UserAvatar from "./common/UserAvatar";

const Messaging = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const conversationsData = [
        {
          id: 1,
          name: "Maître Julien",
          avatar: "MJ",
          preview: "Bonjour, avez-vous reçu un document...",
          time: "10:30",
          unread: 3,
          online: true,
          messages: [
            {
              id: 1,
              content:
                "Bonjour, avez-vous reçu les documents pour le contrat de prestation ?",
              time: "10:15",
              sender: "them",
            },
            {
              id: 2,
              content:
                "Bonjour Maître Julien, oui j'ai bien reçu tous les documents. Je les ai transférés à l'équipe juridique.",
              time: "10:18",
              sender: "me",
            },
          ],
        },
        {
          id: 2,
          name: "Avocat Dupont",
          avatar: "AD",
          preview: "Je vous envoie le contrat signé...",
          time: "Hier",
          unread: 0,
          online: false,
          messages: [],
        },
      ];

      setConversations(conversationsData);
      if (conversationsData.length > 0) {
        setSelectedConversation(conversationsData[0]);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversation.id ? { ...conv, unread: 0 } : conv
      )
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message = {
      id: Date.now(),
      content: newMessage,
      time: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: "me",
    };

    setSelectedConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              preview: newMessage,
              time: new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              messages: [...conv.messages, message],
            }
          : conv
      )
    );

    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ConversationItem = ({ conversation, isSelected, onClick }) => (
    <div
      onClick={onClick}
      className={`flex items-center p-4 border-b border-light cursor-pointer transition-colors relative ${
        isSelected
          ? "bg-light dark:bg-gray-700"
          : "hover:bg-light/50 dark:hover:bg-gray-700/50"
      }`}
    >
      <UserAvatar
        name={conversation.name}
        avatar={conversation.avatar}
        online={conversation.online}
        size="md"
      />

      <div className="flex-1 min-w-0 mr-4">
        <div className="font-semibold text-secondary mb-1 truncate">
          {conversation.name}
        </div>
        <div className="text-sm text-tertiary truncate">
          {conversation.preview}
        </div>
      </div>

      <div className="absolute right-4 top-4 text-right flex flex-col items-end gap-1">
        <div className="text-xs text-tertiary whitespace-nowrap">
          {conversation.time}
        </div>
        {conversation.unread > 0 && (
          <div className="w-5 h-5 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {conversation.unread}
          </div>
        )}
      </div>
    </div>
  );

  const MessageBubble = ({ message }) => (
    <div
      className={`max-w-[70%] p-3 rounded-xl ${
        message.sender === "me"
          ? "bg-primary-light text-white self-end"
          : "bg-light text-secondary self-start dark:bg-gray-700 dark:text-dark-secondary"
      }`}
    >
      <div>{message.content}</div>
      <div
        className={`text-xs mt-2 ${
          message.sender === "me" ? "text-blue-100" : "text-tertiary"
        }`}
      >
        {message.time}
      </div>
    </div>
  );

  return (
    <Layout activePage="messaging">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-primary">Messagerie</h1>
        <button className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors">
          Nouvelle conversation
        </button>
      </div>

      {/* Messaging Container */}
      <div
        className="flex flex-1 gap-6"
        style={{ height: "calc(100vh - 200px)" }}
      >
        {/* Conversations Sidebar */}
        <div className="card card-rounded w-80 min-w-80 flex flex-col">
          {/* Conversations Header */}
          <div className="p-5 border-b border-light">
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-dark-primary"
            />
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversation?.id === conversation.id}
                onClick={() => handleSelectConversation(conversation)}
              />
            ))}

            {filteredConversations.length === 0 && (
              <div className="flex items-center justify-center h-32 text-tertiary">
                Aucune conversation trouvée
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="card card-rounded flex-1 flex flex-col min-w-96">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-5 border-b border-light flex items-center">
                <div className="font-semibold text-secondary">
                  {selectedConversation.name}
                </div>
                <div className="text-sm text-tertiary ml-3 flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      selectedConversation.online ? "bg-success" : "bg-tertiary"
                    }`}
                  ></span>
                  {selectedConversation.online ? "En ligne" : "Hors ligne"}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
                {selectedConversation.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {selectedConversation.messages.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-tertiary">
                    Aucun message dans cette conversation
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-5 border-t border-light flex gap-3">
                <input
                  type="text"
                  placeholder="Écrivez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-3 border border-light rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-dark-primary"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors whitespace-nowrap"
                >
                  Envoyer
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-tertiary">
              Sélectionnez une conversation pour commencer à discuter
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Messaging;
