// ============================================================
// FINANCEOS - ADMIN MESSAGES
// ============================================================

import { useEffect, useMemo, useState } from "react";

import {
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Trash2,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

// ============================================================
// STORAGE KEYS
// ============================================================

const MESSAGE_STORAGE_KEY = "financeos_admin_messages";
const IN_APP_STORAGE_KEY = "financeos_in_app_messages";


// ============================================================
// TEMPORARY USERS
// Later replace with MongoDB / API users
// ============================================================

// Temporary users removed - fetching from API


// ============================================================
// INITIAL MESSAGES
// ============================================================

// Initial messages removed - fetching from API


// ============================================================
// EMPTY FORM
// ============================================================

const emptyForm = {
  messageType: "Personal",
  subject: "",
  message: "",
  channels: ["In-App"],
  delivery: "Now",
  scheduleDate: "",
  scheduleTime: "",
};


// ============================================================
// GET STORED MESSAGES
// ============================================================

// Removed getStoredMessages


// ============================================================
// SAVE IN-APP MESSAGES FOR USER BELL
// ============================================================

function saveInAppMessages(messages) {
  try {
    const notifications = messages
      .filter((message) => {
        return (
          Array.isArray(message.channels) &&
          message.channels.includes("In-App") &&
          message.status !== "Cancelled"
        );
      })
      .map((message) => {
        const scheduledAt =
          message.scheduledDate && message.scheduledTime
            ? `${message.scheduledDate}T${message.scheduledTime}`
            : null;

        return {
          id: message.id,

          title: message.title,
          message: message.message,

          recipient: message.recipient,
          userId: message.userId,
          recipientEmail: message.recipientEmail || null,

          targetType:
            message.type === "Bulk"
              ? "all"
              : "personal",

          type: message.type,

          channels: [...message.channels],

          deliveryStatus:
            message.deliveryStatus?.["In-App"] || message.status,

          status: message.status,

          createdAt: message.createdAt,

          scheduledAt,

          source: "FinanceOS Admin",
        };
      });

    localStorage.setItem(
      IN_APP_STORAGE_KEY,
      JSON.stringify(notifications)
    );

    // Allows Topbar to refresh in the same browser tab.
    window.dispatchEvent(
      new CustomEvent("financeos-in-app-updated")
    );
  } catch (error) {
    console.error(
      "Unable to save FinanceOS in-app notifications:",
      error
    );
  }
}


// ============================================================
// CURRENT DATE / TIME
// ============================================================

function currentDateTime() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(value) {
  if (!value) {
    return "—";
  }

  const [hours, minutes] = value.split(":").map(Number);

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}


// ============================================================
// CALCULATE OVERALL DELIVERY STATUS
// ============================================================

function calculateOverallStatus(deliveryStatus) {
  const statuses = Object.values(deliveryStatus || {});

  if (statuses.length === 0) {
    return "Failed";
  }

  if (statuses.every((status) => status === "Sent")) {
    return "Sent";
  }

  if (statuses.every((status) => status === "Failed")) {
    return "Failed";
  }

  if (statuses.every((status) => status === "Scheduled")) {
    return "Scheduled";
  }

  if (statuses.every((status) => status === "Cancelled")) {
    return "Cancelled";
  }

  return "Partially Delivered";
}


// ============================================================
// ADMIN MESSAGES PAGE
// ============================================================

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");

  const [showCompose, setShowCompose] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [userSearch, setUserSearch] = useState("");

  const [form, setForm] = useState({
    ...emptyForm,
  });

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // FETCH DATA
  // ==========================================================

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("financeos_token");
        const headers = { Authorization: `Bearer ${token}` };

        const [msgRes, usersRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/messages", { headers }),
          fetch("http://localhost:5000/api/admin/users", { headers }),
        ]);

        const msgData = await msgRes.json();
        const usersData = await usersRes.json();

        if (msgData.success) {
          setMessages(msgData.data);
        }
        
        if (usersData.success) {
          setUsers(usersData.users);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ==========================================================
  // SAVE IN-APP MESSAGES
  // ==========================================================

  useEffect(() => {
    saveInAppMessages(messages);
  }, [messages]);


  // ==========================================================
  // FILTER MESSAGES
  // ==========================================================

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return messages;
    }

    return messages.filter((item) =>
      [
        item.id,
        item.title,
        item.message,
        item.recipient,
        item.userId,
        item.recipientEmail,
        item.type,
        item.status,
        item.createdBy,
        ...(item.channels || []),
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [messages, search]);


  // ==========================================================
  // USER SEARCH
  // ==========================================================

  const userResults = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return users.filter((user) =>
      [
        user.id,
        user._id,
        user.userId,
        user.name,
        user.email,
        user.phone,
        user.mobile,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [userSearch, users]);


  // ==========================================================
  // COUNTS
  // ==========================================================

  const scheduledCount = messages.filter(
    (item) => item.status === "Scheduled"
  ).length;

  const sentCount = messages.filter(
    (item) => item.status === "Sent"
  ).length;

  const partialCount = messages.filter(
    (item) => item.status === "Partially Delivered"
  ).length;

  const failedCount = messages.filter(
    (item) => item.status === "Failed"
  ).length;

  const cancelledCount = messages.filter(
    (item) => item.status === "Cancelled"
  ).length;


  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  // ==========================================================
  // TOGGLE CHANNEL
  // ==========================================================

  function toggleChannel(channel) {
    setForm((current) => {
      const exists = current.channels.includes(channel);

      return {
        ...current,

        channels: exists
          ? current.channels.filter(
              (item) => item !== channel
            )
          : [...current.channels, channel],
      };
    });
  }


  // ==========================================================
  // CHOOSE USER
  // ==========================================================

  function chooseUser(user) {
    setSelectedUser(user);
    setUserSearch("");
  }


  // ==========================================================
  // COMPOSE
  // ==========================================================

  function openCompose() {
    setSelectedMessage(null);
    setSelectedUser(null);
    setUserSearch("");

    setForm({
      ...emptyForm,
      channels: ["In-App"],
    });

    setShowCompose(true);
  }

  function closeCompose() {
    setShowCompose(false);

    setSelectedUser(null);
    setUserSearch("");

    setForm({
      ...emptyForm,
      channels: ["In-App"],
    });
  }


  // ==========================================================
  // VIEW
  // ==========================================================

  function openView(message) {
    setSelectedMessage(message);
    setShowView(true);
  }

  function closeView() {
    setShowView(false);
    setSelectedMessage(null);
  }


  // ==========================================================
  // EDIT
  // ==========================================================

  function openEdit(message) {
    if (message.status !== "Scheduled") {
      return;
    }

    setSelectedMessage(message);

    setForm({
      messageType: message.type,
      subject: message.title,
      message: message.message,

      channels: [...message.channels],

      delivery: "Schedule",

      scheduleDate: message.scheduledDate || "",
      scheduleTime: message.scheduledTime || "",
    });

    if (message.userId) {
      const user =
        users.find(
          (item) => item.id === message.userId
        ) || {
          id: message.userId,
          name: message.recipient,
          email: message.recipientEmail || "",
          phone: "",
          status: "",
        };

      setSelectedUser(user);
    } else {
      setSelectedUser(null);
    }

    setShowEdit(true);
  }

  function closeEdit() {
    setShowEdit(false);

    setSelectedMessage(null);
    setSelectedUser(null);

    setForm({
      ...emptyForm,
      channels: ["In-App"],
    });
  }


  // ==========================================================
  // CREATE MESSAGE
  // ==========================================================

  async function handleCreate(event) {
    event.preventDefault();

    if (
      form.messageType === "Personal" &&
      !selectedUser
    ) {
      alert("Please select a recipient.");
      return;
    }

    if (!form.subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    if (!form.message.trim()) {
      alert("Please enter a message.");
      return;
    }

    if (form.channels.length === 0) {
      alert("Select at least one delivery channel.");
      return;
    }

    if (
      form.delivery === "Schedule" &&
      (!form.scheduleDate || !form.scheduleTime)
    ) {
      alert("Select schedule date and time.");
      return;
    }


    // ========================================================
    // PREVENT SCHEDULING IN THE PAST
    // ========================================================

    if (form.delivery === "Schedule") {
      const schedule = new Date(
        `${form.scheduleDate}T${form.scheduleTime}`
      );

      if (
        Number.isNaN(schedule.getTime()) ||
        schedule.getTime() <= Date.now()
      ) {
        alert(
          "Scheduled date and time must be in the future."
        );

        return;
      }
    }


    // ========================================================
    // DELIVERY STATUS
    // ========================================================

    const deliveryStatus = {};

    form.channels.forEach((channel) => {
      deliveryStatus[channel] =
        form.delivery === "Schedule"
          ? "Scheduled"
          : "Sent";
    });


    // ========================================================
    // CREATE
    // ========================================================

    const newMessage = {
      title: form.subject.trim(),
      message: form.message.trim(),

      recipient:
        form.messageType === "Personal"
          ? selectedUser.name
          : "All Users",

      userId:
        form.messageType === "Personal"
          ? selectedUser.id
          : null,

      recipientEmail:
        form.messageType === "Personal"
          ? selectedUser.email
          : null,

      type: form.messageType,

      channels: [...form.channels],

      deliveryStatus,

      status:
        form.delivery === "Schedule"
          ? "Scheduled"
          : "Sent",

      createdBy: "Super Admin",
      scheduledDate:
        form.delivery === "Schedule"
          ? form.scheduleDate
          : null,

      scheduledTime:
        form.delivery === "Schedule"
          ? form.scheduleTime
          : null,
    };

    try {
      const token = localStorage.getItem("financeos_token");
      const res = await fetch("http://localhost:5000/api/admin/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMessage),
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages((current) => [
          data.data,
          ...current,
        ]);
        closeCompose();
      } else {
        alert(data.message || "Failed to create message.");
      }
    } catch (error) {
      console.error("Create Message Error:", error);
      alert("Failed to create message.");
    }
  }


  // ==========================================================
  // EDIT SCHEDULED MESSAGE
  // ==========================================================

  async function handleEdit(event) {
    event.preventDefault();

    if (!selectedMessage) {
      return;
    }

    if (!form.subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    if (!form.message.trim()) {
      alert("Please enter a message.");
      return;
    }

    if (form.channels.length === 0) {
      alert("Select at least one delivery channel.");
      return;
    }

    if (!form.scheduleDate || !form.scheduleTime) {
      alert("Select schedule date and time.");
      return;
    }

    const schedule = new Date(
      `${form.scheduleDate}T${form.scheduleTime}`
    );

    if (
      Number.isNaN(schedule.getTime()) ||
      schedule.getTime() <= Date.now()
    ) {
      alert(
        "Scheduled date and time must be in the future."
      );

      return;
    }

    const deliveryStatus = {};

    form.channels.forEach((channel) => {
      deliveryStatus[channel] = "Scheduled";
    });

    const updatedData = {
      title: form.subject.trim(),
      message: form.message.trim(),
      channels: [...form.channels],
      deliveryStatus,
      status: "Scheduled",
      scheduledDate: form.scheduleDate,
      scheduledTime: form.scheduleTime,
    };

    try {
      const token = localStorage.getItem("financeos_token");
      const res = await fetch(`http://localhost:5000/api/admin/messages/${selectedMessage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages((current) =>
          current.map((item) =>
            item.id === selectedMessage.id ? data.data : item
          )
        );
        closeEdit();
      } else {
        alert(data.message || "Failed to update message.");
      }
    } catch (error) {
      console.error("Update Message Error:", error);
      alert("Failed to update message.");
    }
  }


  // ==========================================================
  // CANCEL MESSAGE
  // ==========================================================

  async function cancelMessage(message) {
    if (message.status !== "Scheduled") {
      return;
    }

    const confirmed = window.confirm(
      `Cancel scheduled message "${message.title}"?`
    );

    if (!confirmed) {
      return;
    }

    const deliveryStatus = {};
    message.channels.forEach((channel) => {
      deliveryStatus[channel] = "Cancelled";
    });

    try {
      const token = localStorage.getItem("financeos_token");
      const res = await fetch(`http://localhost:5000/api/admin/messages/${message.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "Cancelled",
          deliveryStatus,
          cancelledAt: new Date(),
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages((current) =>
          current.map((item) =>
            item.id === message.id ? data.data : item
          )
        );

        if (selectedMessage?.id === message.id) {
          setSelectedMessage(data.data);
        }
      } else {
        alert(data.message || "Failed to cancel message.");
      }
    } catch (error) {
      console.error("Cancel Message Error:", error);
      alert("Failed to cancel message.");
    }
  }


  // ==========================================================
  // RETRY FAILED CHANNELS
  // ==========================================================

  async function retryFailed(message) {
    const failedChannels = message.channels.filter(
      (channel) =>
        message.deliveryStatus?.[channel] === "Failed"
    );

    if (failedChannels.length === 0) {
      alert("There are no failed channels to retry.");
      return;
    }

    const confirmed = window.confirm(
      `Retry failed delivery for: ${failedChannels.join(
        ", "
      )}?`
    );

    if (!confirmed) {
      return;
    }

    const newDeliveryStatus = {
      ...message.deliveryStatus,
    };

    failedChannels.forEach((channel) => {
      newDeliveryStatus[channel] = "Sent";
    });

    const newOverallStatus =
      calculateOverallStatus(newDeliveryStatus);

    try {
      const token = localStorage.getItem("financeos_token");
      const res = await fetch(`http://localhost:5000/api/admin/messages/${message.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deliveryStatus: newDeliveryStatus,
          status: newOverallStatus,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages((current) =>
          current.map((item) =>
            item.id === message.id ? data.data : item
          )
        );

        if (selectedMessage?.id === message.id) {
          setSelectedMessage(data.data);
        }
      } else {
        alert(data.message || "Failed to retry message.");
      }
    } catch (error) {
      console.error("Retry Message Error:", error);
      alert("Failed to retry message.");
    }
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />

        <main className="flex-1 overflow-y-auto p-6">

          <div className="mx-auto max-w-[1500px]">

            {/* HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h1 className="text-2xl font-bold text-[#173b2b]">
                  Messages
                </h1>

                <p className="mt-1 text-sm text-[#718177]">
                  Send personal or bulk communication through
                  In-App, Email and SMS.
                </p>
              </div>

              <button
                type="button"
                onClick={openCompose}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#dff3ad] px-5 py-3 text-sm font-bold text-[#173b2b] transition hover:bg-[#d4eba0]"
              >
                <Plus size={17} />
                Compose Message
              </button>

            </div>


            {/* SUMMARY */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

              <SummaryCard
                title="Scheduled"
                value={scheduledCount}
                icon={CalendarClock}
              />

              <SummaryCard
                title="Sent"
                value={sentCount}
                icon={CheckCircle2}
              />

              <SummaryCard
                title="Partial"
                value={partialCount}
                icon={Clock3}
              />

              <SummaryCard
                title="Failed"
                value={failedCount}
                icon={XCircle}
              />

              <SummaryCard
                title="Cancelled"
                value={cancelledCount}
                icon={Trash2}
              />

            </div>


            {/* SEARCH */}

            <section className="mt-6 rounded-2xl border border-[#dfe6da] bg-white p-5">

              <div className="relative">

                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#839188]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search message, user, ID, channel or status..."
                  className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] py-3 pl-11 pr-4 text-sm text-[#173b2b] outline-none focus:border-[#9fbd82]"
                />

              </div>

            </section>


            {/* TABLE */}

            <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

              <div className="border-b border-[#edf0eb] px-5 py-4">

                <h2 className="text-sm font-bold text-[#173b2b]">
                  Communication History
                </h2>

                <p className="mt-1 text-[10px] text-[#8a978f]">
                  {filteredMessages.length} message(s)
                </p>

              </div>


              <div className="overflow-x-auto">

                <table className="w-full min-w-[1250px]">

                  <thead className="bg-[#f8faf6]">

                    <tr>
                      <TH>Message</TH>
                      <TH>Recipient</TH>
                      <TH>Channels</TH>
                      <TH>Delivery Status</TH>
                      <TH>Schedule</TH>
                      <TH>Created By</TH>
                      <TH>Status</TH>
                      <TH>Actions</TH>
                    </tr>

                  </thead>


                  <tbody>

                    {filteredMessages.length === 0 ? (

                      <tr>

                        <td
                          colSpan={8}
                          className="px-6 py-12 text-center text-sm text-[#718177]"
                        >
                          No messages found.
                        </td>

                      </tr>

                    ) : (

                      filteredMessages.map((item) => (

                        <tr
                          key={item.id}
                          className="border-b border-[#edf0eb] last:border-b-0 hover:bg-[#fbfcfa]"
                        >

                          {/* MESSAGE */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-semibold text-[#173b2b]">
                              {item.title}
                            </p>

                            <p className="mt-1 max-w-[250px] truncate text-xs text-[#718177]">
                              {item.message}
                            </p>

                            <p className="mt-1 font-mono text-[9px] text-[#8a978f]">
                              {item.id}
                            </p>

                          </td>


                          {/* RECIPIENT */}

                          <td className="px-4 py-4">

                            <p className="text-sm font-semibold text-[#526459]">
                              {item.recipient}
                            </p>

                            {item.userId && (
                              <p className="mt-1 font-mono text-[10px] text-[#639a48]">
                                {item.userId}
                              </p>
                            )}

                            {item.recipientEmail && (
                              <p className="mt-1 text-[9px] text-[#8a978f]">
                                {item.recipientEmail}
                              </p>
                            )}

                          </td>


                          {/* CHANNELS */}

                          <td className="px-4 py-4">

                            <div className="flex max-w-[220px] flex-wrap gap-1.5">

                              {item.channels.map((channel) => (
                                <ChannelBadge
                                  key={channel}
                                  channel={channel}
                                />
                              ))}

                            </div>

                          </td>


                          {/* DELIVERY */}

                          <td className="px-4 py-4">

                            <div className="space-y-1.5">

                              {item.channels.map((channel) => (

                                <div
                                  key={channel}
                                  className="flex items-center gap-2"
                                >

                                  <span className="w-[48px] text-[10px] text-[#718177]">
                                    {channel}
                                  </span>

                                  <MiniStatus
                                    status={
                                      item.deliveryStatus?.[
                                        channel
                                      ]
                                    }
                                  />

                                </div>

                              ))}

                            </div>

                          </td>


                          {/* SCHEDULE */}

                          <td className="px-4 py-4">

                            {item.scheduledDate ? (

                              <>
                                <p className="text-xs font-medium text-[#526459]">
                                  {formatDate(
                                    item.scheduledDate
                                  )}
                                </p>

                                <p className="mt-1 text-[10px] text-[#8a978f]">
                                  {formatTime(
                                    item.scheduledTime
                                  )}
                                </p>
                              </>

                            ) : (

                              <span className="text-xs text-[#8a978f]">
                                Immediate
                              </span>

                            )}

                          </td>


                          {/* CREATED */}

                          <td className="px-4 py-4">

                            <p className="text-xs font-medium text-[#526459]">
                              {item.createdBy}
                            </p>

                            <p className="mt-1 text-[9px] text-[#8a978f]">
                              {item.createdAt}
                            </p>

                          </td>


                          {/* STATUS */}

                          <td className="px-4 py-4">

                            <StatusBadge
                              status={item.status}
                            />

                          </td>


                          {/* ACTIONS */}

                          <td className="px-4 py-4">

                            <div className="flex items-center gap-2">

                              <ActionButton
                                icon={Eye}
                                title="View"
                                onClick={() =>
                                  openView(item)
                                }
                              />

                              {item.status === "Scheduled" && (
                                <ActionButton
                                  icon={Edit3}
                                  title="Edit"
                                  onClick={() =>
                                    openEdit(item)
                                  }
                                />
                              )}

                              {item.status === "Scheduled" && (
                                <ActionButton
                                  icon={Trash2}
                                  title="Cancel"
                                  danger
                                  onClick={() =>
                                    cancelMessage(item)
                                  }
                                />
                              )}

                              {(item.status === "Failed" ||
                                item.status ===
                                  "Partially Delivered") && (

                                <ActionButton
                                  icon={RefreshCw}
                                  title="Retry"
                                  onClick={() =>
                                    retryFailed(item)
                                  }
                                />

                              )}

                            </div>

                          </td>

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </div>

        </main>

      </div>


      {/* COMPOSE */}

      {showCompose && (

        <MessageFormModal
          title="Compose Message"
          subtitle="Create a new FinanceOS communication."
          form={form}
          setForm={setForm}
          selectedUser={selectedUser}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          userResults={userResults}
          chooseUser={chooseUser}
          handleChange={handleChange}
          toggleChannel={toggleChannel}
          onClose={closeCompose}
          onSubmit={handleCreate}
          editing={false}
        />

      )}


      {/* EDIT */}

      {showEdit && selectedMessage && (

        <MessageFormModal
          title="Edit Scheduled Message"
          subtitle="Update message content, channels or delivery schedule."
          form={form}
          setForm={setForm}
          selectedUser={selectedUser}
          userSearch=""
          setUserSearch={() => {}}
          userResults={[]}
          chooseUser={() => {}}
          handleChange={handleChange}
          toggleChannel={toggleChannel}
          onClose={closeEdit}
          onSubmit={handleEdit}
          editing
        />

      )}


      {/* VIEW */}

      {showView && selectedMessage && (

        <ViewMessageModal
          message={selectedMessage}
          onClose={closeView}

          onEdit={() => {
            const message = selectedMessage;

            closeView();

            openEdit(message);
          }}

          onCancel={() =>
            cancelMessage(selectedMessage)
          }

          onRetry={() =>
            retryFailed(selectedMessage)
          }
        />

      )}

    </div>
  );
}


// ============================================================
// MESSAGE FORM MODAL
// ============================================================

function MessageFormModal({
  title,
  subtitle,

  form,
  setForm,

  selectedUser,

  userSearch,
  setUserSearch,

  userResults,
  chooseUser,

  handleChange,
  toggleChannel,

  onClose,
  onSubmit,

  editing,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">

      <div className="max-h-[94vh] w-full max-w-[850px] overflow-y-auto rounded-2xl bg-white shadow-xl">

        {/* HEADER */}

        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#edf0eb] bg-white px-6 py-5">

          <div>

            <h2 className="text-lg font-bold text-[#173b2b]">
              {title}
            </h2>

            <p className="mt-1 text-xs text-[#718177]">
              {subtitle}
            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#718177] hover:bg-[#f2f5f0]"
            aria-label="Close"
          >
            <X size={18} />
          </button>

        </div>


        <form
          onSubmit={onSubmit}
          className="p-6"
        >

          {/* MESSAGE TYPE */}

          {!editing && (

            <>

              <FieldLabel>
                Message Type
              </FieldLabel>

              <div className="grid gap-3 sm:grid-cols-2">

                <ChoiceButton
                  active={
                    form.messageType === "Personal"
                  }
                  icon={User}
                  title="Personal"
                  description="Send to one FinanceOS user"

                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      messageType: "Personal",
                    }));
                  }}
                />


                <ChoiceButton
                  active={
                    form.messageType === "Bulk"
                  }
                  icon={Users}
                  title="Bulk"
                  description="Send to all FinanceOS users"

                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      messageType: "Bulk",
                    }));

                    chooseUser(null);
                  }}
                />

              </div>

            </>

          )}


          {/* PERSONAL RECIPIENT */}

          {form.messageType === "Personal" && (

            <div className="mt-6">

              <FieldLabel>
                Recipient
              </FieldLabel>


              {editing ? (

                <div className="rounded-xl border border-[#dfe6da] bg-[#f8faf7] p-4">

                  <p className="text-sm font-bold text-[#173b2b]">
                    {selectedUser?.name || "User"}
                  </p>

                  <p className="mt-1 font-mono text-[10px] text-[#639a48]">
                    {selectedUser?.id || "—"}
                  </p>

                  {selectedUser?.email && (
                    <p className="mt-1 text-xs text-[#718177]">
                      {selectedUser.email}
                    </p>
                  )}

                  <p className="mt-3 text-[10px] text-[#718177]">
                    Recipient cannot be changed after the
                    message has been scheduled.
                  </p>

                </div>

              ) : selectedUser ? (

                <div className="rounded-xl border border-[#dfe6da] bg-[#f8faf7] p-4">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <p className="text-sm font-bold text-[#173b2b]">
                        {selectedUser.name}
                      </p>

                      <p className="mt-1 font-mono text-[10px] text-[#639a48]">
                        {selectedUser.id}
                      </p>

                      <p className="mt-1 text-xs text-[#718177]">
                        {selectedUser.email}
                      </p>

                      <p className="mt-1 text-xs text-[#718177]">
                        {selectedUser.phone}
                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        chooseUser(null)
                      }
                      className="rounded-lg border border-[#dce4d8] px-3 py-1.5 text-[10px] font-semibold text-[#617268]"
                    >
                      Change
                    </button>

                  </div>

                </div>

              ) : (

                <>

                  <div className="relative">

                    <Search
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#839188]"
                    />

                    <input
                      value={userSearch}
                      onChange={(event) =>
                        setUserSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search ID, name, email or phone..."
                      className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#9fbd82]"
                    />

                  </div>


                  {userSearch && (

                    <div className="mt-2 overflow-hidden rounded-xl border border-[#dfe6da]">

                      {userResults.length > 0 ? (

                        userResults.map((user) => (

                          <button
                            key={user.id}
                            type="button"
                            onClick={() =>
                              chooseUser(user)
                            }
                            className="flex w-full items-center justify-between border-b border-[#edf0eb] px-4 py-3 text-left last:border-0 hover:bg-[#f7faf5]"
                          >

                            <div>

                              <p className="text-sm font-semibold text-[#173b2b]">
                                {user.name}
                              </p>

                              <p className="mt-1 font-mono text-[10px] text-[#639a48]">
                                {user.id}
                              </p>

                            </div>


                            <div className="text-right">

                              <p className="text-xs text-[#617268]">
                                {user.email}
                              </p>

                              <p className="mt-1 text-[10px] text-[#8a978f]">
                                {user.phone}
                              </p>

                            </div>

                          </button>

                        ))

                      ) : (

                        <div className="p-4 text-center text-xs text-[#718177]">
                          No users found.
                        </div>

                      )}

                    </div>

                  )}

                </>

              )}

            </div>

          )}


          {/* SUBJECT */}

          <div className="mt-6">

            <FieldLabel>
              Subject
            </FieldLabel>

            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Enter message subject"
              className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm outline-none focus:border-[#9fbd82]"
            />

          </div>


          {/* MESSAGE */}

          <div className="mt-5">

            <FieldLabel>
              Message
            </FieldLabel>

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              placeholder="Write your message..."
              className="w-full resize-none rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm leading-6 outline-none focus:border-[#9fbd82]"
            />

          </div>


          {/* CHANNELS */}

          <div className="mt-6">

            <FieldLabel>
              Delivery Channels
            </FieldLabel>

            <div className="grid gap-3 sm:grid-cols-3">

              <ChannelOption
                selected={
                  form.channels.includes("In-App")
                }
                icon={Bell}
                title="In-App"
                description="User notification bell"
                onClick={() =>
                  toggleChannel("In-App")
                }
              />


              <ChannelOption
                selected={
                  form.channels.includes("Email")
                }
                icon={Mail}
                title="Email"
                description="Registered email"
                onClick={() =>
                  toggleChannel("Email")
                }
              />


              <ChannelOption
                selected={
                  form.channels.includes("SMS")
                }
                icon={Smartphone}
                title="SMS"
                description="Registered mobile"
                onClick={() =>
                  toggleChannel("SMS")
                }
              />

            </div>

            <p className="mt-2 text-[10px] leading-4 text-[#8a978f]">
              In-App messages are stored for the FinanceOS user
              notification bell. Email and SMS are simulated
              until backend services are connected.
            </p>

          </div>


          {/* DELIVERY */}

          {!editing && (

            <div className="mt-6">

              <FieldLabel>
                Delivery
              </FieldLabel>

              <div className="grid gap-3 sm:grid-cols-2">

                <ChoiceButton
                  active={
                    form.delivery === "Now"
                  }
                  icon={Send}
                  title="Send Now"
                  description="Send immediately"

                  onClick={() =>
                    setForm((current) => ({
                      ...current,

                      delivery: "Now",

                      scheduleDate: "",
                      scheduleTime: "",
                    }))
                  }
                />


                <ChoiceButton
                  active={
                    form.delivery === "Schedule"
                  }
                  icon={CalendarClock}
                  title="Schedule"
                  description="Send later"

                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      delivery: "Schedule",
                    }))
                  }
                />

              </div>

            </div>

          )}


          {/* SCHEDULE */}

          {(form.delivery === "Schedule" || editing) && (

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div>

                <FieldLabel>
                  Scheduled Date
                </FieldLabel>

                <input
                  type="date"
                  name="scheduleDate"
                  value={form.scheduleDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm outline-none focus:border-[#9fbd82]"
                />

              </div>


              <div>

                <FieldLabel>
                  Scheduled Time
                </FieldLabel>

                <input
                  type="time"
                  name="scheduleTime"
                  value={form.scheduleTime}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm outline-none focus:border-[#9fbd82]"
                />

              </div>

            </div>

          )}


          {/* ACTIONS */}

          <div className="mt-7 flex justify-end gap-3 border-t border-[#edf0eb] pt-5">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dce4d8] px-5 py-2.5 text-sm font-semibold text-[#617268]"
            >
              Cancel
            </button>


            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-bold text-[#173b2b]"
            >

              {editing ? (

                <>
                  <Check size={16} />
                  Save Changes
                </>

              ) : form.delivery === "Schedule" ? (

                <>
                  <CalendarClock size={16} />
                  Schedule Message
                </>

              ) : (

                <>
                  <Send size={16} />
                  Send Message
                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


// ============================================================
// VIEW MESSAGE MODAL
// ============================================================

function ViewMessageModal({
  message,
  onClose,
  onEdit,
  onCancel,
  onRetry,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">

      <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-2xl bg-white shadow-xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-[#edf0eb] px-6 py-5">

          <div>

            <h2 className="text-lg font-bold text-[#173b2b]">
              Message Details
            </h2>

            <p className="mt-1 font-mono text-[10px] text-[#639a48]">
              {message.id}
            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f2f5f0]"
          >
            <X
              size={18}
              className="text-[#718177]"
            />
          </button>

        </div>


        <div className="p-6">

          <Detail
            label="Recipient"
            value={message.recipient}
          />


          {message.userId && (

            <Detail
              label="User ID"
              value={message.userId}
            />

          )}


          {message.recipientEmail && (

            <Detail
              label="Email"
              value={message.recipientEmail}
            />

          )}


          <Detail
            label="Subject"
            value={message.title}
          />


          {/* MESSAGE */}

          <div className="mt-4">

            <p className="text-[10px] font-bold uppercase text-[#718177]">
              Message
            </p>

            <div className="mt-2 rounded-xl border border-[#dfe6da] bg-[#fafcf9] p-4 text-sm leading-6 text-[#526459]">
              {message.message}
            </div>

          </div>


          {/* DELIVERY */}

          <div className="mt-5">

            <p className="text-[10px] font-bold uppercase text-[#718177]">
              Delivery
            </p>

            <div className="mt-3 space-y-2">

              {message.channels.map((channel) => (

                <div
                  key={channel}
                  className="flex items-center justify-between rounded-lg border border-[#e1e7de] p-3"
                >

                  <ChannelBadge
                    channel={channel}
                  />

                  <MiniStatus
                    status={
                      message.deliveryStatus?.[
                        channel
                      ]
                    }
                  />

                </div>

              ))}

            </div>

          </div>


          {/* SCHEDULE */}

          {message.scheduledDate && (

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              <Detail
                label="Scheduled Date"
                value={
                  formatDate(
                    message.scheduledDate
                  )
                }
              />

              <Detail
                label="Scheduled Time"
                value={
                  formatTime(
                    message.scheduledTime
                  )
                }
              />

            </div>

          )}


          {/* CREATED */}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <Detail
              label="Created By"
              value={message.createdBy}
            />

            <Detail
              label="Created At"
              value={message.createdAt}
            />

          </div>


          {/* UPDATED */}

          {message.updatedAt && (

            <div className="mt-3 grid gap-3 sm:grid-cols-2">

              <Detail
                label="Last Updated By"
                value={message.updatedBy}
              />

              <Detail
                label="Last Updated At"
                value={message.updatedAt}
              />

            </div>

          )}


          {/* CANCELLED */}

          {message.cancelledAt && (

            <div className="mt-3 grid gap-3 sm:grid-cols-2">

              <Detail
                label="Cancelled By"
                value={message.cancelledBy}
              />

              <Detail
                label="Cancelled At"
                value={message.cancelledAt}
              />

            </div>

          )}


          {/* ACTIONS */}

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#edf0eb] pt-5">

            {message.status === "Scheduled" && (

              <>

                <button
                  type="button"
                  onClick={onCancel}
                  className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-500"
                >
                  <Trash2 size={14} />
                  Cancel Message
                </button>


                <button
                  type="button"
                  onClick={onEdit}
                  className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-xs font-bold text-[#173b2b]"
                >
                  <Edit3 size={14} />
                  Edit Message
                </button>

              </>

            )}


            {(message.status === "Failed" ||
              message.status ===
                "Partially Delivered") && (

              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-xs font-bold text-[#173b2b]"
              >
                <RefreshCw size={14} />
                Retry Failed
              </button>

            )}


            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dce4d8] px-4 py-2.5 text-xs font-semibold text-[#617268]"
            >
              Close
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// FIELD LABEL
// ============================================================

function FieldLabel({ children }) {
  return (
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.05em] text-[#617268]">
      {children}
    </label>
  );
}


// ============================================================
// CHANNEL OPTION
// ============================================================

function ChannelOption({
  selected,
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        selected
          ? "border-[#a9c98e] bg-[#f0f7eb]"
          : "border-[#dfe6da] bg-white hover:bg-[#fafcf9]"
      }`}
    >

      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
          selected
            ? "border-[#57923d] bg-[#57923d] text-white"
            : "border-[#cfd8ca]"
        }`}
      >
        {selected && (
          <Check size={12} />
        )}
      </div>


      <Icon
        size={17}
        className={
          selected
            ? "text-[#57923d]"
            : "text-[#718177]"
        }
      />


      <div>

        <p className="text-sm font-semibold text-[#173b2b]">
          {title}
        </p>

        <p className="mt-1 text-[10px] text-[#8a978f]">
          {description}
        </p>

      </div>

    </button>
  );
}


// ============================================================
// CHOICE BUTTON
// ============================================================

function ChoiceButton({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex gap-3 rounded-xl border p-4 text-left transition ${
        active
          ? "border-[#a9c98e] bg-[#f0f7eb]"
          : "border-[#dfe6da] bg-white hover:bg-[#fafcf9]"
      }`}
    >

      <Icon
        size={18}
        className={
          active
            ? "text-[#57923d]"
            : "text-[#718177]"
        }
      />


      <div>

        <p className="text-sm font-semibold text-[#173b2b]">
          {title}
        </p>

        <p className="mt-1 text-[10px] text-[#8a978f]">
          {description}
        </p>

      </div>

    </button>
  );
}


// ============================================================
// ACTION BUTTON
// ============================================================

function ActionButton({
  icon: Icon,
  title,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
        danger
          ? "border-red-100 text-red-500 hover:bg-red-50"
          : "border-[#dce4d8] text-[#617268] hover:bg-[#f2f6ef]"
      }`}
    >
      <Icon size={14} />
    </button>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs text-[#718177]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#173b2b]">
            {value}
          </p>

        </div>


        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
          <Icon size={18} />
        </div>

      </div>

    </div>
  );
}


// ============================================================
// TABLE HEADER
// ============================================================

function TH({ children }) {
  return (
    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-[#718177]">
      {children}
    </th>
  );
}


// ============================================================
// CHANNEL BADGE
// ============================================================

function ChannelBadge({ channel }) {
  let Icon = Bell;

  if (channel === "Email") {
    Icon = Mail;
  }

  if (channel === "SMS") {
    Icon = Smartphone;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f5ed] px-2.5 py-1 text-[9px] font-semibold text-[#526459]">

      <Icon size={10} />

      {channel}

    </span>
  );
}


// ============================================================
// MINI STATUS
// ============================================================

function MiniStatus({ status }) {
  let style =
    "bg-[#edf6e7] text-[#57923d]";

  if (status === "Scheduled") {
    style =
      "bg-[#fff6df] text-[#99701e]";
  }

  if (status === "Failed") {
    style =
      "bg-[#fff0ed] text-[#b45745]";
  }

  if (status === "Cancelled") {
    style =
      "bg-[#f1f1f1] text-[#777]";
  }

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${style}`}
    >
      {status || "—"}
    </span>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  let style =
    "bg-[#edf6e7] text-[#57923d]";

  if (
    status === "Scheduled" ||
    status === "Partially Delivered"
  ) {
    style =
      "bg-[#fff6df] text-[#99701e]";
  }

  if (status === "Failed") {
    style =
      "bg-[#fff0ed] text-[#b45745]";
  }

  if (status === "Cancelled") {
    style =
      "bg-[#f1f1f1] text-[#777]";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${style}`}
    >
      {status}
    </span>
  );
}


// ============================================================
// DETAIL
// ============================================================

function Detail({
  label,
  value,
}) {
  return (
    <div className="mb-3 rounded-xl border border-[#e1e7de] bg-[#fafcf9] p-4">

      <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#8a978f]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#526459]">
        {value || "—"}
      </p>

    </div>
  );
}