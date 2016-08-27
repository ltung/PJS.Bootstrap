
using Orchard.ContentManagement;
using Orchard.ContentManagement.Handlers;
using Orchard.Localization;
using Theme.Bootswatch.Models;

namespace Theme.Bootswatch.Handlers {
    public class BootstrapThemeSettingsPartHandler : ContentHandler {
        public BootstrapThemeSettingsPartHandler() {
            T = NullLocalizer.Instance;
            Filters.Add(new ActivatingFilter<BootswatchThemeSettingsPart>("Site"));
            Filters.Add(new TemplateFilterForPart<BootswatchThemeSettingsPart>("BootswatchThemeSettings", "Parts/BootswatchThemeSettings", "Theme-Bootswatch"));
        }

        public Localizer T { get; set; }

        protected override void GetItemMetadata(GetContentItemMetadataContext context) {
            if (context.ContentItem.ContentType != "Site")
                return;
            base.GetItemMetadata(context);
            context.Metadata.EditorGroupInfo.Add(new GroupInfo(T("Theme-Bootswatch")));
        }
    }
}