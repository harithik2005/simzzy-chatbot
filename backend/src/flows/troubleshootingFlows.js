/**
 * Troubleshooting Decision Tree Flows
 * Each flow is a state machine: { stepId, message, quickReplies, nextSteps, terminalAction }
 * terminalAction: 'resolve' | 'escalate' | 'reorder'
 */

const troubleshootingFlows = {

  // ─────────────────────────────────────────────────────────────────────────────
  // FLOW: QR Code Scanning Problem
  // ─────────────────────────────────────────────────────────────────────────────
  QR_CODE_SCAN_ISSUE: {
    id: "QR_CODE_SCAN_ISSUE",
    title: "QR Code Scanning Problem",
    steps: {
      start: {
        message: "Let's fix your QR code scanning issue step by step.\n\nFirst — has this QR code ever successfully scanned before, or is this the first attempt?",
        quickReplies: ["First attempt", "It scanned before but now it won't"],
        nextSteps: {
          "First attempt": "check_already_added",
          "It scanned before but now it won't": "already_added_confirm"
        }
      },
      check_already_added: {
        message: "Important: An eSIM can only be added to ONE phone at a time.\n\nPlease check: Is the eSIM possibly already installed on this phone (or another phone you've used)?\n\nGo to: Settings → Mobile Data / Cellular → Check if a new eSIM line is already listed.",
        quickReplies: ["Yes, it's already added", "No, I don't see it", "Not sure"],
        nextSteps: {
          "Yes, it's already added": "resolve_already_added",
          "No, I don't see it": "check_correct_line",
          "Not sure": "check_correct_line"
        }
      },
      already_added_confirm: {
        message: "If you previously scanned and added the eSIM successfully, the QR code cannot be scanned again — each QR code is single-use.\n\nCheck your phone settings to confirm the eSIM is already listed: Settings → Mobile Data / Cellular.",
        quickReplies: ["eSIM is listed there", "eSIM is NOT listed", "I accidentally deleted it"],
        nextSteps: {
          "eSIM is listed there": "resolve_esim_exists",
          "eSIM is NOT listed": "escalate_reorder",
          "I accidentally deleted it": "esim_deleted_flow"
        }
      },
      resolve_already_added: {
        message: "✅ Your eSIM is already installed. You don't need to scan again!\n\nIf you're having connection issues, I can help troubleshoot that separately.",
        quickReplies: ["I have no internet", "That solved it"],
        nextSteps: {
          "I have no internet": "FLOW:NO_CONNECTION",
          "That solved it": "resolved"
        },
        terminalAction: "resolve"
      },
      check_correct_line: {
        message: "Please ensure you are scanning under the correct menu:\n\n📱 **iPhone:** Settings → Mobile Data → Add Data Plan → Scan QR Code\n📱 **Android:** Settings → Connections → SIM Manager → Add eSIM → Scan\n\nAlso confirm you have a stable Wi-Fi or internet connection during scanning.\n\nTry scanning again. Did it work?",
        quickReplies: ["Yes, it worked!", "Still not scanning"],
        nextSteps: {
          "Yes, it worked!": "resolved",
          "Still not scanning": "check_device_locked"
        }
      },
      check_device_locked: {
        message: "Please check the following:\n\n1. Is your device SIM-locked to a specific carrier? (Go to Settings → General → About → look for 'Carrier Lock: No SIM restrictions')\n2. Try restarting your phone and scanning again.\n3. Ensure your camera lens is clean and the QR code image is clear (try saving and zooming in).\n\nAny of these seem to be the issue?",
        quickReplies: ["Device is carrier-locked", "Restarted and tried — still failing", "Camera issue fixed it"],
        nextSteps: {
          "Device is carrier-locked": "escalate_carrier_locked",
          "Restarted and tried — still failing": "escalate_reorder",
          "Camera issue fixed it": "resolved"
        }
      },
      esim_deleted_flow: {
        message: "If you deleted the eSIM from your phone, you may be able to **reinstall it on the same device**.\n\n1. Go to Settings → Mobile Data / Cellular → Add Data Plan\n2. Use your original QR code from your email or dashboard\n\n⚠️ Reinstallation on a DIFFERENT phone requires TSim support intervention. Is this the same phone?",
        quickReplies: ["Same phone — it worked", "Same phone — still failing", "Different phone"],
        nextSteps: {
          "Same phone — it worked": "resolved",
          "Same phone — still failing": "escalate",
          "Different phone": "escalate_different_phone"
        }
      },
      resolve_esim_exists: {
        message: "✅ Great — your eSIM is already installed. No need to re-scan.\n\nIf it's installed but not connecting, let me help with that.",
        quickReplies: ["Help me connect", "All good"],
        nextSteps: { "Help me connect": "FLOW:NO_CONNECTION", "All good": "resolved" },
        terminalAction: "resolve"
      },
      escalate_reorder: {
        message: "It seems the eSIM download has failed or is in a stuck state. This can occasionally happen due to a network issue on the provisioning server (DP+).\n\n🔧 **Next steps:** Our support team will need to re-issue a new eSIM for you.\n\nPlease contact us:\n- **Email:** support@simzzy.com\n- **WhatsApp:** +852 60140451\n\nPlease provide your order number and the ICCID/card number when contacting us.",
        terminalAction: "escalate"
      },
      escalate_carrier_locked: {
        message: "A carrier-locked device cannot accept eSIMs from other providers. You would need to contact your original carrier to unlock your device first.\n\nIf you believe your device is unlocked but still facing issues, please contact our support team at support@simzzy.com.",
        terminalAction: "escalate"
      },
      escalate_different_phone: {
        message: "Transferring an eSIM to a different device requires our support team's intervention.\n\nPlease contact us at **support@simzzy.com** or **WhatsApp: +852 60140451** with your order details. We'll arrange the transfer for you.",
        terminalAction: "escalate"
      },
      escalate: {
        message: "I wasn't able to resolve this issue through self-troubleshooting. Please contact our support team:\n\n- **Email:** support@simzzy.com\n- **WhatsApp:** +852 60140451\n- **Hours:** 08:00am – 10:30pm (UTC+8)\n\nPlease share your order number and ICCID for faster assistance.",
        terminalAction: "escalate"
      },
      resolved: {
        message: "✅ Glad we could resolve that! Is there anything else I can help you with?",
        terminalAction: "resolve"
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FLOW: No Internet Connection
  // ─────────────────────────────────────────────────────────────────────────────
  NO_CONNECTION: {
    id: "NO_CONNECTION",
    title: "No Internet Connection",
    steps: {
      start: {
        message: "Let's troubleshoot your internet connection step by step.\n\nFirst: Is your eSIM installed on your phone? (Check Settings → Mobile Data / Cellular — you should see an extra data line or eSIM label)",
        quickReplies: ["Yes, it's installed", "I'm not sure", "No / Can't find it"],
        nextSteps: {
          "Yes, it's installed": "check_correct_line_selected",
          "I'm not sure": "check_correct_line_selected",
          "No / Can't find it": "FLOW:ESIM_INSTALL_ISSUE"
        }
      },
      check_correct_line_selected: {
        message: "Please verify you have selected the correct eSIM line for mobile data:\n\n📱 **iPhone:** Settings → Mobile Data → select your eSIM line (not your regular SIM)\n📱 **Android:** Settings → Connections → SIM Manager → set eSIM as data SIM\n\nIs the correct line selected?",
        quickReplies: ["Yes, correct line selected", "No, I changed it — checking now", "There's only one line showing"],
        nextSteps: {
          "Yes, correct line selected": "check_roaming",
          "No, I changed it — checking now": "check_roaming",
          "There's only one line showing": "check_roaming"
        }
      },
      check_roaming: {
        message: "Now check if **Data Roaming** is turned ON:\n\n📱 **iPhone:** Settings → Mobile Data → [Your eSIM Line] → Data Roaming → ON\n📱 **Android:** Settings → Connections → Mobile Networks → Data Roaming → ON\n\n⚠️ For international eSIMs, Data Roaming MUST be enabled.\n\nIs Data Roaming now ON?",
        quickReplies: ["Data Roaming is ON", "It was off — I turned it on", "I can't find the setting"],
        nextSteps: {
          "Data Roaming is ON": "check_plan_status",
          "It was off — I turned it on": "check_after_roaming",
          "I can't find the setting": "guide_roaming_help"
        }
      },
      check_after_roaming: {
        message: "Good! Now restart your device and wait 60 seconds.\n\nDid turning on Data Roaming fix the connection?",
        quickReplies: ["Yes! It's working now", "Still no connection"],
        nextSteps: {
          "Yes! It's working now": "resolved",
          "Still no connection": "check_plan_status"
        }
      },
      guide_roaming_help: {
        message: "On iPhone:\n1. Go to **Settings**\n2. Tap **Mobile Data** (or Cellular)\n3. Tap your **eSIM line name**\n4. Toggle **Data Roaming** to ON\n\nAfter enabling, restart your phone. Did that help?",
        quickReplies: ["Yes, working now!", "Still no connection"],
        nextSteps: {
          "Yes, working now!": "resolved",
          "Still no connection": "check_plan_status"
        }
      },
      check_plan_status: {
        message: "Let's check if your plan is still active and hasn't expired.\n\nLog in to your dashboard or check your purchase history. Is your plan still showing as **'Using'** (not Expired)?",
        quickReplies: ["Plan is 'Using' / Active", "Plan shows Expired", "I can't check"],
        nextSteps: {
          "Plan is 'Using' / Active": "check_apn",
          "Plan shows Expired": "plan_expired_resolution",
          "I can't check": "check_apn"
        }
      },
      check_apn: {
        message: "Let's check your **APN settings**. APNs are usually set automatically, but they may have been changed or locked.\n\n📱 **iPhone:** Settings → Mobile Data → [eSIM Line] → APN Settings (or it may be under a config profile)\n📱 **Android:** Settings → Connections → Mobile Networks → Access Point Names\n\nIs your APN set to the value shown in your plan details (e.g., '3gnet', 'plus', 'cmhk')?",
        quickReplies: ["APN looks correct", "APN is wrong / blank", "I don't know the correct APN"],
        nextSteps: {
          "APN looks correct": "check_operator",
          "APN is wrong / blank": "apn_fix_guide",
          "I don't know the correct APN": "apn_from_plan"
        }
      },
      apn_from_plan: {
        message: "You can find your correct APN in your plan details:\n\n1. Go to your **dashboard** or open your **fulfillment email**\n2. Look for **APN** under the package details\n3. Enter that value in your phone's APN settings\n\nOnce set, restart your phone. Did this help?",
        quickReplies: ["Yes, working now!", "Still not working"],
        nextSteps: {
          "Yes, working now!": "resolved",
          "Still not working": "check_operator"
        }
      },
      apn_fix_guide: {
        message: "To fix APN on iPhone:\n1. Settings → Mobile Data → [eSIM Line] → tap 'APN' field\n2. Enter the APN from your plan details email\n3. Restart your phone\n\n⚠️ Note: If your iPhone has a Configuration Profile installed that locks the APN, it may need to be removed first.\n\nDid this resolve the issue?",
        quickReplies: ["Yes, fixed!", "APN is locked / grayed out", "Still not working"],
        nextSteps: {
          "Yes, fixed!": "resolved",
          "APN is locked / grayed out": "escalate_config_profile",
          "Still not working": "check_operator"
        }
      },
      check_operator: {
        message: "Your device might be connecting to the wrong network operator.\n\nPlease try:\n1. Go to **Settings → Mobile Data → Network Selection**\n2. Turn off **Automatic** temporarily\n3. Select the correct operator specified in your plan details\n4. Switch back to Automatic\n\nDid this help?",
        quickReplies: ["Yes, found correct operator!", "Still no connection", "No operator options visible"],
        nextSteps: {
          "Yes, found correct operator!": "resolved",
          "Still no connection": "try_reactive",
          "No operator options visible": "try_reactive"
        }
      },
      try_reactive: {
        message: "Let's try a **SIM Reactive** — this restarts the SIM activation process:\n\n📱 **iPhone:**\n1. Go to Settings → Mobile Data → [eSIM Line]\n2. Tap **SIM Applications**\n3. Tap **Reactive** and wait 2–5 minutes\n4. After completion, turn Data Roaming ON again\n\n📱 **Android:** Please visit: http://www.esimplus.jp/reboot_tutorial/index_en.html\n\nDid the Reactive SIM fix your connection?",
        quickReplies: ["Yes! It's working now", "Still no internet"],
        nextSteps: {
          "Yes! It's working now": "resolved",
          "Still no internet": "escalate"
        }
      },
      plan_expired_resolution: {
        message: "Your plan has expired. Your eSIM will no longer have internet access after the plan period ends.\n\nTo continue using data, you would need to purchase a new plan. Would you like help with that?",
        quickReplies: ["How to buy a new plan", "Contact support"],
        nextSteps: {
          "How to buy a new plan": "FLOW:HOW_TO_PURCHASE",
          "Contact support": "escalate"
        },
        terminalAction: "resolve"
      },
      escalate_config_profile: {
        message: "A Configuration Profile on your iPhone may be locking the APN setting. To remove it:\n1. Go to **Settings → General → VPN & Device Management**\n2. Find and remove any profiles related to your carrier or a previous operator\n\nIf you're not sure which profile to remove, please contact our support team at support@simzzy.com.",
        terminalAction: "escalate"
      },
      escalate: {
        message: "We've gone through all self-service troubleshooting steps and couldn't resolve your connection issue.\n\nPlease contact our support team with your **order number** and **ICCID**:\n\n- 📧 **Email:** support@simzzy.com\n- 💬 **WhatsApp:** +852 60140451\n- **Hours:** 08:00am – 10:30pm (UTC+8)",
        terminalAction: "escalate"
      },
      resolved: {
        message: "✅ Excellent! Your connection is restored. Enjoy your data!\n\nIs there anything else I can help you with?",
        terminalAction: "resolve"
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FLOW: Slow Internet
  // ─────────────────────────────────────────────────────────────────────────────
  SLOW_INTERNET: {
    id: "SLOW_INTERNET",
    title: "Slow Internet Speed",
    steps: {
      start: {
        message: "I'll help you investigate the slow speed issue.\n\nFirst: Which type of plan do you have?",
        quickReplies: ["Daily plan (e.g., 1GB/day)", "Total plan (e.g., 5GB for the whole trip)", "Not sure"],
        nextSteps: {
          "Daily plan (e.g., 1GB/day)": "check_daily_exhausted",
          "Total plan (e.g., 5GB for the whole trip)": "check_total_exhausted",
          "Not sure": "check_total_exhausted"
        }
      },
      check_daily_exhausted: {
        message: "For daily plans, speed is reduced after the daily data limit is reached.\n\nCheck your **daily usage** in your dashboard or purchase history. Has today's usage reached your daily limit (e.g., 1GB)?\n\n⚠️ Note: Usage display may be delayed by up to 1 hour, so if you're close to the limit, you may have already exceeded it.",
        quickReplies: ["Daily limit reached / nearly reached", "Still well below the limit", "Usage shows 0MB"],
        nextSteps: {
          "Daily limit reached / nearly reached": "daily_limit_reached",
          "Still well below the limit": "check_operator_slow",
          "Usage shows 0MB": "usage_delay_explain"
        }
      },
      check_total_exhausted: {
        message: "For total plans, speed may reduce once the full data allowance is used up.\n\nCheck your **total data usage** in your dashboard. Has your total usage reached the plan limit?",
        quickReplies: ["Yes, limit reached / nearly reached", "No, still have data remaining", "Usage shows 0MB"],
        nextSteps: {
          "Yes, limit reached / nearly reached": "data_exhausted_resolution",
          "No, still have data remaining": "check_operator_slow",
          "Usage shows 0MB": "usage_delay_explain"
        }
      },
      daily_limit_reached: {
        message: "Your daily data allowance has been exhausted. Speed will be restored automatically at your plan's daily reset time.\n\nYour reset time can be found in your package details under **Daily Plan Reset Time**.\n\nIf you need immediate high-speed data, you may need to purchase a new plan.",
        quickReplies: ["When does data reset?", "Buy new plan", "Contact support"],
        nextSteps: {
          "When does data reset?": "FAQ:DAILY_RESET_QUERY",
          "Buy new plan": "FLOW:HOW_TO_PURCHASE",
          "Contact support": "escalate"
        },
        terminalAction: "resolve"
      },
      data_exhausted_resolution: {
        message: "Your total plan data has been fully used. To continue with internet access, you would need to purchase a new plan.\n\nWould you like help purchasing a new plan?",
        quickReplies: ["Help me buy a new plan", "Contact support"],
        nextSteps: {
          "Help me buy a new plan": "FLOW:HOW_TO_PURCHASE",
          "Contact support": "escalate"
        },
        terminalAction: "resolve"
      },
      usage_delay_explain: {
        message: "A display of 0MB doesn't necessarily mean your eSIM isn't working — usage reporting can be delayed by up to 1 hour.\n\nPlease wait a bit and check again. In the meantime, try running a speed test to confirm if data is truly being throttled.\n\nIs the speed still consistently slow after waiting?",
        quickReplies: ["Yes still slow", "Speed improved"],
        nextSteps: {
          "Yes still slow": "check_operator_slow",
          "Speed improved": "resolved"
        }
      },
      check_operator_slow: {
        message: "The slow speed may be due to a congested or suboptimal operator connection.\n\nPlease try:\n1. Go to **Settings → Mobile Data → Network Selection**\n2. Disable **Automatic**\n3. Manually select a different available operator in your country\n4. Switch back to Automatic\n\nDid changing the operator help?",
        quickReplies: ["Yes, speed improved!", "Still slow", "No other operators visible"],
        nextSteps: {
          "Yes, speed improved!": "resolved",
          "Still slow": "escalate",
          "No other operators visible": "escalate"
        }
      },
      escalate: {
        message: "I'm sorry the slow speed persists. Our support team will investigate this further.\n\nPlease contact us with your **order number** and **ICCID**:\n\n- 📧 support@simzzy.com\n- 💬 WhatsApp: +852 60140451",
        terminalAction: "escalate"
      },
      resolved: {
        message: "✅ Great! Speed is back to normal. Enjoy your browsing!\n\nAnything else I can help with?",
        terminalAction: "resolve"
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FLOW: eSIM Deleted
  // ─────────────────────────────────────────────────────────────────────────────
  ESIM_DELETED: {
    id: "ESIM_DELETED",
    title: "eSIM Deleted from Phone",
    steps: {
      start: {
        message: "I understand you've deleted your eSIM. Let's see if we can help.\n\nIs this the **same phone** you originally installed the eSIM on?",
        quickReplies: ["Yes, same phone", "No, different phone"],
        nextSteps: {
          "Yes, same phone": "try_reinstall_same",
          "No, different phone": "different_phone_escalate"
        }
      },
      try_reinstall_same: {
        message: "Good news — you can try reinstalling on the same phone:\n\n1. Open your **fulfillment email** or go to your **dashboard** to get your original QR code\n2. Go to Settings → Mobile Data → Add Data Plan\n3. Scan the QR code again\n\nDid this work?",
        quickReplies: ["Yes! eSIM reinstalled", "QR code won't scan", "I don't have my QR code"],
        nextSteps: {
          "Yes! eSIM reinstalled": "resolved",
          "QR code won't scan": "FLOW:QR_CODE_SCAN_ISSUE",
          "I don't have my QR code": "get_qr_code"
        }
      },
      get_qr_code: {
        message: "To get your QR code again:\n\n1. Check your **email inbox** for your fulfillment email\n2. Or log in to your **dashboard → Purchase History**\n\nIf you can't find it, please contact support at support@simzzy.com with your order number.",
        quickReplies: ["Found QR code — trying now", "Need support help"],
        nextSteps: {
          "Found QR code — trying now": "try_reinstall_same",
          "Need support help": "escalate"
        }
      },
      different_phone_escalate: {
        message: "Unfortunately, eSIMs can only be transferred to a different device with the help of our support team.\n\nPlease contact us and we'll arrange the transfer:\n\n- 📧 **Email:** support@simzzy.com\n- 💬 **WhatsApp:** +852 60140451\n\nPlease provide your order number and the EID of the new device.",
        terminalAction: "escalate"
      },
      escalate: {
        message: "Please contact our support team for further assistance:\n\n- 📧 support@simzzy.com\n- 💬 WhatsApp: +852 60140451\n- **Hours:** 08:00am – 10:30pm (UTC+8)",
        terminalAction: "escalate"
      },
      resolved: {
        message: "✅ Your eSIM is reinstalled. Is there anything else I can help you with?",
        terminalAction: "resolve"
      }
    }
  }
};

module.exports = troubleshootingFlows;
