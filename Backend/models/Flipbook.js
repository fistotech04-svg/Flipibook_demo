import mongoose from "mongoose";
import { nanoid } from "nanoid";

const flipbookSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
    },
    folderName: {
      type: [String], // Array of strings to support tags like 'Recent Book'
      required: true,
    },
    flipbookName: {
      type: String,
      required: true,
    },
    pages: [
      {
        pageNumber: { type: Number, required: true },
        name: { type: String, required: true }, // Display Name
        fileName: { type: String, required: true }, // Actual file name
        v_id: { type: String, required: true }, // Unique ID for finding assets
        size: { type: Number, default: 0 }, // Size in bytes
        hide: { type: Number, default: 0 }, // 1 means hidden, 0 means visible
      },
    ],
    fileSize: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    v_id: {
      type: String,
      required: true,
      unique: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    trash: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
    Customized_Settings: {
      FlipbookInfo: {
        category: { type: String, default: "" },
        language: { type: String, default: "" },
        tags: [{ type: String }],
        quotes: { type: String, default: "" },
        about: { type: String, default: "" },
        publisher: { type: String, default: "" },
        publishedAt: { type: Date },
        width: { type: Number },
        height: { type: Number },
        templateId: { type: String },
        orientation: { type: String },
      },
      Branding: {
        logoSettings: {
          src: { type: String, default: "" },
          url: { type: String, default: "" },
          type: { type: String, default: "Fit" },
          opacity: { type: Number, default: 100 },
          cropData: { type: Object, default: null },
          adjustments: {
            exposure: { type: Number, default: 0 },
            contrast: { type: Number, default: 0 },
            saturation: { type: Number, default: 0 },
            temperature: { type: Number, default: 0 },
            tint: { type: Number, default: 0 },
            highlights: { type: Number, default: 0 },
            shadows: { type: Number, default: 0 },
          },
        },
        watermarkSettings: {
          src: { type: String, default: "" },
          type: { type: String, default: "Fit" },
          opacity: { type: Number, default: 64 },
          position: { type: String, default: "Bottom Right" },
          cropData: { type: Object, default: null },
          adjustments: {
            exposure: { type: Number, default: 0 },
            contrast: { type: Number, default: 0 },
            saturation: { type: Number, default: 0 },
            temperature: { type: Number, default: 0 },
            tint: { type: Number, default: 0 },
            highlights: { type: Number, default: 0 },
            shadows: { type: Number, default: 0 },
          },
        },
        preloaderSettings: {
          layout: { type: String, default: "spinner" },
          text: { type: String, default: "Loading Flipbook Please Wait...." },
          font: { type: String, default: "Poppins" },
          bgColor: { type: String, default: "#D6E0F4" },
          textColor: { type: String, default: "#ffffff" },
          spinnerColor: { type: String, default: "#3B3C8A" },
          showPercentage: { type: Boolean, default: false },
        },
      },
      Background: {
        // Primary background type (Solid, Gradient, Image, Video, Media, Themes, ReactBits, Animations, Gallery, etc.)
        style: {
          type: String,
          default: "Solid",
        },
        color: { type: String, default: "#FFFFFF" },
        opacity: { type: Number, default: 100, min: 0, max: 100 },
        gradient: {
          type: String,
          default: "linear-gradient(90deg, #FFFFFF 0%, #D1D5DB 100%)",
        },
        gradientType: { type: String, default: "linear" },
        gradientAngle: { type: Number, default: 90 },
        gradientRadius: { type: Number, default: 50 },
        gradientStops: {
          type: [
            {
              offset: { type: Number, min: 0, max: 100 },
              color: { type: String },
              opacity: { type: Number, default: 100, min: 0, max: 100 },
            },
          ],
          default: [
            { offset: 0, color: "#FFFFFF", opacity: 100 },
            { offset: 100, color: "#D1D5DB", opacity: 100 },
          ],
        },
        image: { type: String, default: "" },
        video: { type: String, default: "" },
        fit: {
          type: String,
          default: "Cover",
        },
        cropData: { type: Object, default: null },
        adjustments: {
          exposure: { type: Number, default: 0 },
          contrast: { type: Number, default: 0 },
          saturation: { type: Number, default: 0 },
          temperature: { type: Number, default: 0 },
          tint: { type: Number, default: 0 },
          highlights: { type: Number, default: 0 },
          shadows: { type: Number, default: 0 },
        },
        // Dynamic WebGL/Canvas ReactBits Theme
        reactBitType: { type: String, default: "" },
        // Independent Overlay Animation (e.g., Snow, Rain, FallingLeaves) that overlays on top of background
        animation: { type: String, default: "" },
        savedSolidColor: { type: String, default: "" },
        savedNonThemeSettings: { type: Object, default: null },
      },
      MenuBar: {
        navigation: {
          addTextToIcons: { type: Boolean, default: false },
          addTextToIconsSettings: {
            font: { type: String, default: "Arial" },
          },
          nextPrevButtons: { type: Boolean, default: true },
          mouseWheel: { type: Boolean, default: true },
          dragToTurn: { type: Boolean, default: true },
          pageQuickAccess: { type: Boolean, default: true },
          tableOfContents: { type: Boolean, default: true },
          tocSettings: {
            addSearch: { type: Boolean, default: true },
            addPageNumber: { type: Boolean, default: true },
            addSerialNumberHeading: { type: Boolean, default: true },
            addSerialNumberSubheading: { type: Boolean, default: true },
            content: [
              {
                id: { type: mongoose.Schema.Types.Mixed },
                title: { type: String, default: "" },
                page: { type: String, default: "" },
                subheadings: [
                  {
                    id: { type: mongoose.Schema.Types.Mixed },
                    title: { type: String, default: "" },
                    page: { type: String, default: "" },
                  },
                ],
              },
            ],
          },
          pageThumbnails: { type: Boolean, default: true },
          bookmark: { type: Boolean, default: true },
          bookmarkSettings: {
            icon: { type: String, default: "default" },
            font: { type: String, default: "Poppins" },
            color: { type: String, default: "#C45A5A" },
            shape: { type: Number, default: 1 },
            style: { type: Number, default: 1 },
            items: [
              {
                id: { type: mongoose.Schema.Types.Mixed },
                title: { type: String, default: "" },
                page: { type: String, default: "" },
              },
            ],
          },
          startEndNav: { type: Boolean, default: true },
        },
        viewing: {
          zoom: { type: Boolean, default: true },
          zoomSettings: {
            maximumZoom: { type: Number, default: 4 },
            twoClickToZoom: { type: Boolean, default: true },
          },
          fullScreen: { type: Boolean, default: true },
        },
        interaction: {
          search: { type: Boolean, default: true },
          gallery: { type: Boolean, default: true },
          gallerySettings: {
            imageFitType: { type: String, default: "Fill All" },
            images: [
              {
                id: { type: mongoose.Schema.Types.Mixed },
                url: { type: String, default: "" },
                src: { type: String, default: "" },
                name: { type: String, default: "" },
                fileName: { type: String, default: "" },
              },
            ],
            transitionEffect: { type: String, default: "Linear" },
            primaryColor: { type: String, default: "#5d57cfff" },
            secondaryColor: { type: String, default: "#9CA3AF" },
            bgColor: { type: String, default: "#FFFFFF" },
            navigationIconType: { type: String, default: "Chevron" },
            autoPlay: { type: Boolean, default: true },
            speed: { type: Number, default: 2 },
            infiniteLoop: { type: Boolean, default: true },
            showDots: { type: Boolean, default: true },
          },
        },
        media: {
          autoFlip: { type: Boolean, default: true },
          autoFlipSettings: {
            duration: { type: Number, default: 4 },
            countdown: { type: Boolean, default: false },
          },
          audio: { type: Boolean, default: true },
          audioSettings: {
            flipSound: { type: String, default: "Soft Paper Flip" },
            pageSpecificSound: { type: Boolean, default: false },
            bgSound: { type: String, default: "BG Sound 1" },
            bgSoundFile: { type: String, default: "" },
            customBgSounds: [
              {
                id: { type: mongoose.Schema.Types.Mixed },
                name: { type: String, default: "" },
                url: { type: String, default: "" },
                fileName: { type: String, default: "" },
              },
            ],
          },
        },
        shareExport: {
          share: { type: Boolean, default: true },
          download: { type: Boolean, default: true },
        },
        brandingProfile: {
          logo: { type: Boolean, default: true },
          profile: { type: Boolean, default: true },
        },
      },
      Layouts: {
        layoutStyle: { type: mongoose.Schema.Types.Mixed, default: 1 },
        layoutColors: {
          toolbarColor: {
            primary: { type: String, default: "" },
            secondary: { type: String, default: "" },
          },
          popupColor: {
            primary: { type: String, default: "" },
            secondary: { type: String, default: "" },
          },
        },
      },
      BookAppearance: {
        makeFirstLastPageHard: { type: Boolean, default: false },
        selectCustomHardPages: { type: Boolean, default: false },
        hardCover: { type: Boolean, default: false },
        customHardPages: [{ type: mongoose.Schema.Types.Mixed }],
        flipStyle: { type: String, default: "Classic Flip" },
        flipSpeed: { type: String, default: "Slow" },
        corner: { type: String, default: "Sharp" },
        dropShadow: {
          position: { type: String, default: "Bottom Right" },
          strength: { type: Number, default: 35 },
          softness: { type: Number, default: 35 },
          color: { type: String, default: "#000000" },
        },
      },
      leadForm: {
        enabled: { type: Boolean, default: false },
        formTitle: { type: String, default: "Request More Information" },
        leadText: {
          type: String,
          default:
            "Tell us about your requirements and our team will reach out.",
        },
        buttonText: { type: String, default: "Request Callback" },
        fields: [{ type: mongoose.Schema.Types.Mixed }],
        appearance: {
          timing: { type: String, default: "before" },
          afterSeconds: { type: Number, default: 30 },
          afterPages: { type: Number, default: 4 },
          allowSkip: { type: Boolean, default: true },
          skipBehavior: { type: String, default: "never" },
          fontStyle: { type: String, default: "Arial" },
          textFill: { type: String, default: "#3E4491" },
          textStroke: { type: String, default: "#" },
          bgFill: { type: String, default: "#FFFFFF" },
          bgStroke: { type: String, default: "#" },
          btnFill: { type: String, default: "#4A3AFF" },
          btnStroke: { type: String, default: "#" },
          btnText: { type: String, default: "#FFFFFF" },
        },
      },
      Visibility: {
        shareId: {
          type: String,
          default: () => nanoid(12),
          sparse: true,
        },
        access: {
          type: String,
          enum: [
            "public",
            "private",
            "password",
            "invite_only",
            "Public",
            "Private",
            "Password Protect",
            "Invite Only Access",
          ],
          default: "public",
        },
        password: { type: String, default: "" },
        accessKey: { type: String, default: "" },
        isPasswordSaved: { type: Boolean, default: false },
        otp: { type: String, default: null },
        inviteOnly: {
          autoExpire: {
            enabled: { type: Boolean, default: false },
            days: { type: String, default: "0 Days" },
            time: { type: String, default: "5 Mins" },
            duration: { type: String, default: "5 Mins" },
            grantedAt: { type: Date, default: Date.now },
          },
          emails: [
            {
              email: { type: String },
              status: { type: String, default: "valid" },
            },
          ],
          domains: [
            {
              domain: { type: String },
              status: { type: String, default: "valid" },
            },
          ],
        },
      },
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    viewers: {
      type: [String],
      default: [],
    },
    addedToShelfCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    bookRating: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        name: { type: String, default: "" },
        userEmail: { type: String, default: "" },
        ratingValue: { type: Number, default: 0, min: 1, max: 5 },
        review: { type: String, default: "" },
        profileImgUrl: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { strict: true },
);

// Ensure a user cannot have two books with the same name in the same folder
flipbookSchema.index(
  { userEmail: 1, folderName: 1, flipbookName: 1 },
  { unique: true },
);

const Flipbook = mongoose.model("Flipbook", flipbookSchema);

// Auto-drop problematic legacy non-sparse unique index share.shareId_1 if it exists in MongoDB
Flipbook.collection.dropIndex("share.shareId_1").catch(() => { });
Flipbook.collection
  .dropIndex("Customized_Settings.Visibility.shareId_1")
  .catch(() => { });

export default Flipbook;