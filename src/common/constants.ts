
class Constants {

    public static API_URL_new = "https://www.tracerrgt.com/rgt/index_1.php/";
    public static BASE_URL = "https://www.tracerrgt.com/rgt/index_1.php/";

    public static Google_map_API = "AIzaSyDa_jfQ1B9eWfym-lnYbUMNgqgzeAZDtT8";

    public static PROD_VER = false;
    public static VER_STR = "4.01";
    public static DEBUG = false;
    public static TIMEOUT_MS = 180000;
    public static MODE = "DEV"; // "LIVE" "DEV"

    public static CONT = {
        Login_Contro: "login",
        Mobile_Contro: "mob_v2_1_1",

    }

    public static CMD = {
        LOGIN: "authenticate",
        Req_Group: "req_group",
        Req_Dash_All: "dashboard_detail",
        Req_Color: "req_sts_clr",
        Req_Vehi_info: "generator_detail",
        Req_Vehi_trip: "req_veh_trip",
        Req_trip_path: "req_trip_path",
        Req_Noti: "notification_list",
        Req_Event_List: "event_list",
        Req_Event_Report: "event_report",
        Req_Fuel_Efficiency_Report: "fuel_efficiency_report",
        Req_Fill_Drop_Report: "fill_drop_report",
        Req_Fill_Drop: "filling_and_dropping",
        Req_Fuel_graph: "fuel_chart",
        Req_Take_Tour: "help_screen",

        LOGOUT: "logout",

        // Postman Collection Explicit Commands
        AUTHENTICATE: "authenticate",
        DASHBOARD_DETAIL: "dashboard_detail",
        GENERATOR_DETAIL: "generator_detail",
        NOTIFICATION_LIST: "notification_list",
        PARAMETER_LIST: "parameter_list",
        HISTORY_MAP_DATA: "history_map_data",
        EVENT_REPORT: "event_report",
        FUEL_EFFICIENCY_REPORT: "fuel_efficiency_report",
        FILLING_AND_DROPPING: "filling_and_dropping",
        FILL_DROP_REPORT: "fill_drop_report",
        FUEL_CHART: "fuel_chart",
        EVENT_LIST: "event_list",
        UPDATE_EVENT_STATUS: "update_event_status",
        HELP_SCREEN: "help_screen",
        GENERATOR_ON_OFF_LIST: "generator_on_off_list",
        UPDATE_GEN_ON_OFF: "update_gen_on_off"
    }

    public static Veh_color = {
        Key_Active_Color: '#68c521',
        key_Stopped_Color: '#078dfc',
        Key_Offline_Color: '#a9a9a9',
        Key_Idle_Color: '#fe6911',
        Key_Towing_Color: "fe6911"

    }

    public static storageValue = {
        Key_Todays: 'todaysData',
        Key_TodaysGroup: 'todaysGroupData',

        key_date_today: 'todaydate',

        Key_Month: 'MonthsData',
        Key_MonthGroup: 'MonthsGroupData',

        key_date_from: 'fromdate',
        key_date_to: 'todate',
        Key_Fav_data: 'favItem',

        Key_GroupAPI: "groupApi",
        key_GroupWithStatus: "groupnamestatus",
        key_VehicleDetails: "vehicledtlstatus",

        key_Fuel_GroupWithStatus: "fuelgroupnamestatus",
        key_Fuel_VehicleDetails: "fuelvehicledtlstatus",

        key_Map_GroupWithStatus: "mapgroupnamestatus",


    }

}
export default Constants;
