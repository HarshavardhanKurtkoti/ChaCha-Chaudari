import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { chatHistory as messages } from '../data';
import PropTypes from 'prop-types';

const MessageContext = createContext({
	chatHistory: [],
	addMessage: () => {},
	resetHistory: () => {},
	updateLastAssistant: () => {},
});

const MessageProvider = ({ children }) => {
	// Initialize from localStorage if available, else fall back to default messages
	const initialHistory = useMemo(() => {
		try {
			const raw = localStorage.getItem('chatHistory');
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) return parsed;
			}
		} catch { /* ignore parse errors */ }
		return messages;
	}, []);
	const [chatHistory, setChatHistory] = useState(initialHistory);

	const addMessage = (role, content) => {
		const messageObj = { role, content };
		setChatHistory(prev => {
			const next = [...prev, messageObj];
			// Keep last 100 messages to bound localStorage size
			return next.length > 100 ? next.slice(-100) : next;
		});
	};

	const resetHistory = () => {
		setChatHistory(messages);
	};

	const updateLastAssistant = (appendText) => {
		if (typeof appendText !== 'string' || !appendText) return;
		setChatHistory(prev => {
			if (!prev.length) return [{ role: 'assistant', content: appendText }];
			const last = prev[prev.length - 1];
			if (last.role === 'assistant') {
				const updated = { ...last, content: (last.content || '') + appendText };
				const next = [...prev.slice(0, -1), updated];
				return next;
			}
			return [...prev, { role: 'assistant', content: appendText }];
		});
	};

	// Persist to localStorage whenever chatHistory changes
	useEffect(() => {
		try {
			localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
		} catch { /* storage may be unavailable */ }
	}, [chatHistory]);

	return <MessageContext.Provider value={{ chatHistory, addMessage, resetHistory, updateLastAssistant }}>{children}</MessageContext.Provider>;
};

export const useMessageContext = () => useContext(MessageContext);

export default MessageProvider;

MessageProvider.propTypes = {
	children: PropTypes.node,
};
