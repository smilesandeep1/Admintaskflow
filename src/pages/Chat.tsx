import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { chatApi } from "@/db/api";
import type { ChatMessageWithSender, ChatType, Profile } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Send, Users, Building2, User, Trash2 } from "lucide-react";
import { supabase } from "@/db/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Chat() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ChatType>("individual");
  const [selectedChat, setSelectedChat] = useState<{
    type: ChatType;
    id: string;
    name: string;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      loadUsers();
    }
  }, [profile, activeTab]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages();
      const subscription = subscribeToMessages();
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUsers = async () => {
    if (!profile) return;

    try {
      let loadedUsers: Profile[] = [];
      
      if (activeTab === "individual") {
        console.log("Loading users for sections:", profile.sections);
        loadedUsers = await chatApi.getUsersInSections(profile.sections);
        console.log("Loaded users before filter:", loadedUsers);
        loadedUsers = loadedUsers.filter(u => u.id !== profile.id);
        console.log("Loaded users after filter:", loadedUsers);
      } else if (activeTab === "level") {
        console.log("Loading users for level:", profile.role);
        loadedUsers = await chatApi.getUsersByLevel(profile.role);
        console.log("Loaded users for level:", loadedUsers);
        loadedUsers = loadedUsers.filter(u => u.id !== profile.id);
      }
      
      setUsers(loadedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  const loadMessages = async () => {
    if (!selectedChat) return;

    try {
      setLoading(true);
      const loadedMessages = await chatApi.getMessages(
        selectedChat.type,
        selectedChat.type === "individual" ? selectedChat.id : undefined,
        selectedChat.type !== "individual" ? selectedChat.id : undefined
      );
      setMessages(loadedMessages);

      const unreadIds = loadedMessages
        .filter(m => !m.is_read && m.sender_id !== user?.id)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        await chatApi.markAsRead(unreadIds);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedChat) {
      return { unsubscribe: () => {} };
    }

    let filter = `chat_type=eq.${selectedChat.type}`;
    
    if (selectedChat.type === "individual") {
      filter += `,recipient_id=eq.${selectedChat.id}`;
    } else {
      filter += `,chat_group=eq.${selectedChat.id}`;
    }

    const subscription = supabase
      .channel(`chat:${selectedChat.type}:${selectedChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessageWithSender;
          
          const { data: sender } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMsg.sender_id)
            .maybeSingle();
          
          if (sender) {
            newMsg.sender = sender;
          }
          
          setMessages((prev) => [...prev, newMsg]);
          
          if (newMsg.sender_id !== user?.id) {
            await chatApi.markAsRead([newMsg.id]);
          }
        }
      )
      .subscribe();

    return subscription;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      await chatApi.sendMessage(
        selectedChat.type,
        newMessage.trim(),
        selectedChat.type === "individual" ? selectedChat.id : undefined,
        selectedChat.type !== "individual" ? selectedChat.id : undefined
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleDeleteAllMessages = async () => {
    try {
      setLoading(true);
      await chatApi.deleteAllMessages();
      setMessages([]);
      toast.success("All chat history has been deleted");
    } catch (error) {
      console.error("Error deleting messages:", error);
      toast.error("Failed to delete chat history");
    } finally {
      setLoading(false);
    }
  };

  const canDeleteChatHistory = profile?.role === "L1" || profile?.role === "admin";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderChatList = () => {
    if (activeTab === "individual") {
      return (
        <div className="space-y-2">
          {users.map((u) => (
            <Button
              key={u.id}
              variant={selectedChat?.id === u.id ? "secondary" : "ghost"}
              className="w-full justify-start h-auto py-2 whitespace-normal text-left"
              onClick={() =>
                setSelectedChat({
                  type: "individual",
                  id: u.id,
                  name: u.full_name,
                })
              }
            >
              <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                <AvatarFallback>{getInitials(u.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium break-words">{u.full_name}</div>
                <div className="text-xs text-muted-foreground break-words">
                  {u.designation}
                </div>
              </div>
            </Button>
          ))}
          {users.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No users in your sections
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "section" && profile) {
      return (
        <div className="space-y-2">
          {profile.sections.map((section) => (
            <Button
              key={section}
              variant={selectedChat?.id === section ? "secondary" : "ghost"}
              className="w-full justify-start h-auto py-2 whitespace-normal text-left"
              onClick={() =>
                setSelectedChat({
                  type: "section",
                  id: section,
                  name: section,
                })
              }
            >
              <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="break-words">{section}</span>
            </Button>
          ))}
        </div>
      );
    }

    if (activeTab === "level" && profile) {
      return (
        <div className="space-y-2">
          <Button
            variant={
              selectedChat?.id === profile.role ? "secondary" : "ghost"
            }
            className="w-full justify-start h-auto py-2 whitespace-normal text-left"
            onClick={() =>
              setSelectedChat({
                type: "level",
                id: profile.role,
                name: `Level ${profile.role}`,
              })
            }
          >
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="break-words">Level {profile.role}</span>
          </Button>
        </div>
      );
    }

    return null;
  };

  const renderMessages = () => {
    if (!selectedChat) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a conversation to start chatting
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading messages...
        </div>
      );
    }

    return (
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-2 max-w-[70%] ${
                    isOwn ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getInitials(msg.sender?.full_name || "Unknown")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div
                      className={`rounded-lg p-3 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {!isOwn && (
                        <div className="text-xs font-medium mb-1">
                          {msg.sender?.full_name}
                        </div>
                      )}
                      <div className="text-sm">{msg.message}</div>
                    </div>
                    <div
                      className={`text-xs text-muted-foreground mt-1 ${
                        isOwn ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-8rem)]">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7ooucjdxhcsg/conv-7oowe77h6v40/20251127/file-7ud1shl72ebk.png" 
              alt="Chat" 
              className="w-10 h-10 object-contain"
            />
          </CardTitle>
          {canDeleteChatHistory && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Chat History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Chat History</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all chat messages from the database for all users.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllMessages} disabled={loading}>
                    {loading ? "Deleting..." : "Delete All"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex gap-4 overflow-hidden">
          <div className="w-80 flex flex-col overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as ChatType);
                setSelectedChat(null);
                setMessages([]);
              }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="individual">
                  <User className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="section">
                  <Building2 className="h-4 w-4 mr-2" />
                  Sections
                </TabsTrigger>
                <TabsTrigger value="level">
                  <Users className="h-4 w-4 mr-2" />
                  Level
                </TabsTrigger>
              </TabsList>
              <Separator className="my-4" />
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <TabsContent value="individual" className="mt-0">
                    {renderChatList()}
                  </TabsContent>
                  <TabsContent value="section" className="mt-0">
                    {renderChatList()}
                  </TabsContent>
                  <TabsContent value="level" className="mt-0">
                    {renderChatList()}
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </div>

          <Separator orientation="vertical" />

          <div className="flex-1 flex flex-col">
            {selectedChat && (
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  {selectedChat.type === "individual" && (
                    <User className="h-5 w-5" />
                  )}
                  {selectedChat.type === "section" && (
                    <Building2 className="h-5 w-5" />
                  )}
                  {selectedChat.type === "level" && (
                    <Users className="h-5 w-5" />
                  )}
                  <h3 className="font-semibold">{selectedChat.name}</h3>
                  <Badge variant="outline" className="ml-auto">
                    {selectedChat.type}
                  </Badge>
                </div>
              </div>
            )}

            {renderMessages()}

            {selectedChat && (
              <div className="pt-4 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
