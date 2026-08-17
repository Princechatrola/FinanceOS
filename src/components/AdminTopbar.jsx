// ============================================================
// FINANCEOS - ADMIN TOPBAR
// ============================================================

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  CircleAlert,
  Mail,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  UserPlus,
  X,
} from "lucide-react";


// ============================================================
// STORAGE
// ============================================================

const ADMIN_MESSAGES_KEY =
  "financeos_admin_messages";

const ADMIN_READ_NOTIFICATIONS_KEY =
  "financeos_admin_read_notifications";


// ============================================================
// SAMPLE ADMIN EVENTS
//
// These are temporary frontend events.
// Later MongoDB/backend will provide real events.
// ============================================================

const sampleNotifications = [
  {
    id: "ADMIN-NOT-001",

    type: "user",

    title: "New User Registered",

    message:
      "A new FinanceOS user account was registered.",

    createdAt:
      "29 Jul 2026, 09:30 AM",
  },

  {
    id: "ADMIN-NOT-002",

    type: "system",

    title: "FinanceOS Admin Portal",

    message:
      "Administrative services are operating normally.",

    createdAt:
      "29 Jul 2026, 08:30 AM",
  },
];


// ============================================================
// READ STORAGE
// ============================================================

function readStorageArray(
  key
) {
  try {

    const value =
      localStorage.getItem(
        key
      );


    if (!value) {
      return [];
    }


    const parsed =
      JSON.parse(
        value
      );


    return Array.isArray(
      parsed
    )
      ? parsed
      : [];

  } catch {

    return [];

  }
}


// ============================================================
// CREATE ADMIN MESSAGE EVENTS
// ============================================================

function buildMessageNotifications(
  messages
) {

  const notifications =
    [];


  messages.forEach(
    (message) => {


      // ======================================================
      // FAILED CHANNELS
      // ======================================================

      const failedChannels =
        (message.channels || [])
          .filter(
            (channel) =>
              message
                .deliveryStatus?.[
                channel
              ] ===
              "Failed"
          );


      failedChannels.forEach(
        (channel) => {

          notifications.push({

            id:
              `FAILED-${message.id}-${channel}`,

            type:
              channel === "Email"
                ? "email"
                : channel === "SMS"
                  ? "sms"
                  : "message",

            title:
              `${channel} Delivery Failed`,

            message:
              `"${message.title}" could not be delivered to ${message.recipient}.`,

            createdAt:
              message.updatedAt ||
              message.createdAt,

          });

        }
      );


      // ======================================================
      // SCHEDULED MESSAGE
      // ======================================================

      if (
        message.status ===
        "Scheduled"
      ) {

        notifications.push({

          id:
            `SCHEDULED-${message.id}`,

          type:
            "schedule",

          title:
            "Message Scheduled",

          message:
            `"${message.title}" is scheduled for ${message.recipient}.`,

          createdAt:
            message.updatedAt ||
            message.createdAt,

        });

      }


      // ======================================================
      // PARTIAL DELIVERY
      // ======================================================

      if (
        message.status ===
        "Partially Delivered"
      ) {

        notifications.push({

          id:
            `PARTIAL-${message.id}`,

          type:
            "warning",

          title:
            "Partial Delivery",

          message:
            `"${message.title}" was not delivered through every selected channel.`,

          createdAt:
            message.updatedAt ||
            message.createdAt,

        });

      }

    }
  );


  return notifications;
}


// ============================================================
// ICON
// ============================================================

function NotificationIcon({
  type,
}) {

  if (
    type === "user"
  ) {
    return (
      <UserPlus size={17} />
    );
  }


  if (
    type === "email"
  ) {
    return (
      <Mail size={17} />
    );
  }


  if (
    type === "sms"
  ) {
    return (
      <Smartphone size={17} />
    );
  }


  if (
    type === "schedule"
  ) {
    return (
      <CalendarClock
        size={17}
      />
    );
  }


  if (
    type === "warning"
  ) {
    return (
      <CircleAlert
        size={17}
      />
    );
  }


  if (
    type === "message"
  ) {
    return (
      <MessageSquare
        size={17}
      />
    );
  }


  return (
    <ShieldCheck
      size={17}
    />
  );
}


// ============================================================
// ADMIN TOPBAR
// ============================================================

function AdminTopbar() {


  // ==========================================================
  // DROPDOWN
  // ==========================================================

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);


  // ==========================================================
  // ADMIN MESSAGES
  // ==========================================================

  const [
    adminMessages,
    setAdminMessages,
  ] = useState(() =>
    readStorageArray(
      ADMIN_MESSAGES_KEY
    )
  );


  // ==========================================================
  // READ NOTIFICATION IDS
  // ==========================================================

  const [
    readIds,
    setReadIds,
  ] = useState(() =>
    readStorageArray(
      ADMIN_READ_NOTIFICATIONS_KEY
    )
  );


  // ==========================================================
  // DROPDOWN REF
  // ==========================================================

  const notificationRef =
    useRef(null);


  // ==========================================================
  // SAVE READ IDS
  // ==========================================================

  useEffect(
    () => {

      localStorage.setItem(
        ADMIN_READ_NOTIFICATIONS_KEY,

        JSON.stringify(
          readIds
        )
      );

    },
    [
      readIds,
    ]
  );


  // ==========================================================
  // REFRESH MESSAGE DATA
  // ==========================================================

  useEffect(
    () => {


      function loadMessages() {

        setAdminMessages(
          readStorageArray(
            ADMIN_MESSAGES_KEY
          )
        );

      }


      // Another browser tab changes storage

      function handleStorage(
        event
      ) {

        if (
          event.key ===
          ADMIN_MESSAGES_KEY
        ) {

          loadMessages();

        }

      }


      // Reload when browser window becomes active

      window.addEventListener(
        "storage",
        handleStorage
      );


      window.addEventListener(
        "focus",
        loadMessages
      );


      return () => {

        window.removeEventListener(
          "storage",
          handleStorage
        );


        window.removeEventListener(
          "focus",
          loadMessages
        );

      };

    },
    []
  );


  // ==========================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ==========================================================

  useEffect(
    () => {


      function handleOutsideClick(
        event
      ) {

        if (
          notificationRef.current &&
          !notificationRef.current.contains(
            event.target
          )
        ) {

          setNotificationsOpen(
            false
          );

        }

      }


      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );


      return () => {

        document.removeEventListener(
          "mousedown",
          handleOutsideClick
        );

      };

    },
    []
  );


  // ==========================================================
  // MESSAGE NOTIFICATIONS
  // ==========================================================

  const messageNotifications =
    useMemo(
      () =>
        buildMessageNotifications(
          adminMessages
        ),
      [
        adminMessages,
      ]
    );


  // ==========================================================
  // ALL ADMIN NOTIFICATIONS
  // ==========================================================

  const notifications =
    useMemo(
      () => {

        return [
          ...messageNotifications,
          ...sampleNotifications,
        ].map(
          (notification) => ({

            ...notification,

            read:
              readIds.includes(
                notification.id
              ),

          })
        );

      },
      [
        messageNotifications,
        readIds,
      ]
    );


  // ==========================================================
  // UNREAD
  // ==========================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;


  // ==========================================================
  // MARK ONE READ
  // ==========================================================

  function markAsRead(
    id
  ) {

    setReadIds(
      (current) => {


        if (
          current.includes(
            id
          )
        ) {

          return current;

        }


        return [
          ...current,
          id,
        ];

      }
    );
  }


  // ==========================================================
  // MARK ALL READ
  // ==========================================================

  function markAllAsRead() {

    setReadIds(
      (current) => [

        ...new Set([

          ...current,

          ...notifications.map(
            (notification) =>
              notification.id
          ),

        ]),

      ]
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <header
      className="
        relative z-40
        flex h-[82px] w-full
        items-center justify-between
        border-b border-[#e5eae2]
        bg-white px-7
      "
    >


      {/* ======================================================
          LEFT
      ====================================================== */}

      <div>

        <h1 className="text-[24px] font-bold tracking-tight text-[#173b2b]">

          Admin Dashboard

        </h1>


        <p className="mt-0.5 text-sm text-[#718177]">

          Overview of FinanceOS

        </p>

      </div>


      {/* ======================================================
          RIGHT
      ====================================================== */}

      <div className="flex items-center gap-5">


        {/* ====================================================
            NOTIFICATION CENTER
        ==================================================== */}

        <div
          ref={
            notificationRef
          }
          className="relative"
        >


          {/* BELL */}

          <button

            type="button"

            onClick={() =>
              setNotificationsOpen(
                (current) =>
                  !current
              )
            }

            className={`
              relative flex h-10 w-10
              items-center justify-center
              rounded-xl border
              transition

              ${
                notificationsOpen
                  ? `
                    border-[#b6ceaa]
                    bg-[#f1f7ec]
                    text-[#43822e]
                  `
                  : `
                    border-[#e2e8de]
                    bg-[#fbfcfa]
                    text-[#506459]
                    hover:bg-[#f1f7ec]
                    hover:text-[#43822e]
                  `
              }
            `}

            aria-label="Admin notifications"

            aria-expanded={
              notificationsOpen
            }

          >

            <Bell size={19} />


            {/* COUNT */}

            {unreadCount > 0 && (

              <span
                className="
                  absolute -right-1 -top-1
                  flex min-h-[18px]
                  min-w-[18px]
                  items-center
                  justify-center
                  rounded-full
                  bg-red-500
                  px-1
                  text-[9px]
                  font-bold
                  text-white
                  ring-2 ring-white
                "
              >

                {
                  unreadCount > 9
                    ? "9+"
                    : unreadCount
                }

              </span>

            )}

          </button>


          {/* ==================================================
              DROPDOWN
          ================================================== */}

          {notificationsOpen && (

            <div
              className="
                absolute right-0 top-12
                z-50
                w-[390px]
                overflow-hidden
                rounded-2xl
                border border-[#e2e8de]
                bg-white
                shadow-xl
              "
            >


              {/* HEADER */}

              <div
                className="
                  flex items-start
                  justify-between
                  border-b
                  border-[#edf0eb]
                  px-5 py-4
                "
              >

                <div>

                  <h3 className="text-sm font-bold text-[#173b2b]">

                    Admin Notifications

                  </h3>


                  <p className="mt-1 text-[10px] text-[#8a978f]">

                    {
                      unreadCount > 0
                        ? `${unreadCount} unread notification${
                            unreadCount === 1
                              ? ""
                              : "s"
                          }`
                        : "You're up to date"
                    }

                  </p>

                </div>


                <button

                  type="button"

                  onClick={() =>
                    setNotificationsOpen(
                      false
                    )
                  }

                  className="
                    flex h-8 w-8
                    items-center
                    justify-center
                    rounded-lg
                    text-[#718177]
                    transition
                    hover:bg-[#f3f6f1]
                  "

                  aria-label="Close notifications"

                >

                  <X size={16} />

                </button>

              </div>


              {/* ==================================================
                  MARK ALL
              ================================================== */}

              {unreadCount > 0 && (

                <div
                  className="
                    flex justify-end
                    border-b
                    border-[#edf0eb]
                    px-5 py-2
                  "
                >

                  <button

                    type="button"

                    onClick={
                      markAllAsRead
                    }

                    className="
                      flex items-center
                      gap-1.5
                      text-[10px]
                      font-semibold
                      text-[#43822e]
                      hover:text-[#28622e]
                    "
                  >

                    <Check size={13} />

                    Mark all as read

                  </button>

                </div>

              )}


              {/* ==================================================
                  EMPTY
              ================================================== */}

              {notifications.length ===
                0 && (

                <div className="px-6 py-10 text-center">


                  <div
                    className="
                      mx-auto flex
                      h-12 w-12
                      items-center
                      justify-center
                      rounded-full
                      bg-[#edf6e8]
                      text-[#43822e]
                    "
                  >

                    <Bell size={20} />

                  </div>


                  <p className="mt-3 text-sm font-semibold text-[#173b2b]">

                    No notifications

                  </p>


                  <p className="mt-1 text-[10px] leading-5 text-[#8a978f]">

                    Important FinanceOS administrative events will appear here.

                  </p>

                </div>

              )}


              {/* ==================================================
                  LIST
              ================================================== */}

              {notifications.length >
                0 && (

                <div className="max-h-[410px] overflow-y-auto">


                  {notifications.map(
                    (
                      notification
                    ) => (

                      <button

                        key={
                          notification.id
                        }

                        type="button"

                        onClick={() =>
                          markAsRead(
                            notification.id
                          )
                        }

                        className={`
                          flex w-full
                          items-start
                          gap-3
                          border-b
                          border-[#edf0eb]
                          px-5 py-4
                          text-left
                          transition
                          last:border-b-0

                          ${
                            notification.read
                              ? `
                                bg-white
                                hover:bg-[#fafcf9]
                              `
                              : `
                                bg-[#f7fbf4]
                                hover:bg-[#f1f7ec]
                              `
                          }
                        `}
                      >


                        {/* ICON */}

                        <div
                          className="
                            flex h-10 w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-[#eaf4df]
                            text-[#43822e]
                          "
                        >

                          <NotificationIcon
                            type={
                              notification.type
                            }
                          />

                        </div>


                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">


                          <div className="flex items-start gap-2">


                            <p
                              className="
                                min-w-0 flex-1
                                text-xs
                                font-semibold
                                leading-5
                                text-[#173b2b]
                              "
                            >

                              {
                                notification.title
                              }

                            </p>


                            {!notification.read && (

                              <span
                                className="
                                  mt-1.5
                                  h-2 w-2
                                  shrink-0
                                  rounded-full
                                  bg-[#43822e]
                                "
                              />

                            )}

                          </div>


                          <p
                            className="
                              mt-1
                              text-[10px]
                              leading-4
                              text-[#617268]
                            "
                          >

                            {
                              notification.message
                            }

                          </p>


                          <p
                            className="
                              mt-2
                              text-[9px]
                              text-[#9aa59e]
                            "
                          >

                            {
                              notification.createdAt
                            }

                          </p>

                        </div>

                      </button>

                    )
                  )}

                </div>

              )}


              {/* FOOTER */}

              <div
                className="
                  border-t
                  border-[#edf0eb]
                  bg-[#fafcf9]
                  px-5 py-3
                "
              >

                <p className="text-center text-[9px] text-[#8a978f]">

                  FinanceOS administrative alerts

                </p>

              </div>

            </div>

          )}

        </div>


        {/* ====================================================
            DIVIDER
        ==================================================== */}

        <div className="h-8 w-px bg-[#e4e9e1]" />


        {/* ====================================================
            ADMIN PROFILE
        ==================================================== */}

        <button
          type="button"

          className="
            flex items-center
            gap-3
            rounded-xl
            px-2 py-1.5
            transition
            hover:bg-[#f5f8f2]
          "
        >


          {/* AVATAR */}

          <div
            className="
              flex h-10 w-10
              items-center
              justify-center
              rounded-full
              bg-[#dff0c8]
              text-sm
              font-bold
              text-[#43822e]
            "
          >

            A

          </div>


          {/* INFO */}

          <div className="hidden min-w-[110px] text-left sm:block">


            <p className="text-sm font-semibold text-[#173b2b]">

              Admin User

            </p>


            <div className="mt-0.5 flex items-center gap-1">


              <ShieldCheck
                size={12}
                className="text-[#57923d]"
              />


              <p className="text-[11px] font-medium text-[#57923d]">

                Administrator

              </p>

            </div>

          </div>


          <ChevronDown
            size={16}
            className="text-[#7a8a80]"
          />

        </button>


      </div>

    </header>

  );
}


// ============================================================
// EXPORT
// ============================================================

export default AdminTopbar;