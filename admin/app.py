"""Ledger Admin — Streamlit ops console for the expense-tracker backend.

Authenticates against the existing FastAPI JWT backend and exposes admin-only
views over platform stats, users, transactions and parsed messages.
"""
import os

import pandas as pd
import requests
import streamlit as st

def _get_api_base_url() -> str:
    try:
        if "API_BASE_URL" in st.secrets:
            return str(st.secrets["API_BASE_URL"]).rstrip("/")
    except Exception:
        pass
    return os.environ.get("API_BASE_URL", "http://localhost:8000/api/v1").rstrip("/")


API_BASE_URL = _get_api_base_url()

st.set_page_config(page_title="Ledger Admin", page_icon="\U0001F4D2", layout="wide")


# --------------------------------------------------------------------------- #
# HTTP helpers
# --------------------------------------------------------------------------- #
def _session() -> requests.Session:
    if "http" not in st.session_state:
        st.session_state.http = requests.Session()
    return st.session_state.http


def _auth_headers() -> dict:
    token = st.session_state.get("access_token")
    return {"Authorization": f"Bearer {token}"} if token else {}


def logout():
    for key in ("access_token", "refresh_token", "user"):
        st.session_state.pop(key, None)


def _handle_status(resp: requests.Response) -> bool:
    """Return True if the response is OK; otherwise render an error.

    A 401 clears the token so the login gate reappears.
    """
    if resp.status_code == 200:
        return True
    if resp.status_code == 401:
        st.error("Session expired or unauthorized. Please log in again.")
        logout()
        return False
    try:
        detail = resp.json().get("detail", resp.text)
    except ValueError:
        detail = resp.text
    st.error(f"Request failed ({resp.status_code}): {detail}")
    return False


def api_get(path: str, params: dict | None = None):
    """GET {BASE}{path} with the bearer header. Returns parsed JSON or None."""
    url = f"{API_BASE_URL}{path}"
    try:
        resp = _session().get(url, headers=_auth_headers(), params=params, timeout=30)
    except requests.RequestException as exc:
        st.error(f"Network error calling {url}: {exc}")
        return None
    if not _handle_status(resp):
        return None
    try:
        return resp.json()
    except ValueError:
        st.error(f"Invalid JSON response from {url}")
        return None


def api_post(path: str, json: dict | None = None, data: dict | None = None):
    """POST {BASE}{path} with the bearer header. Returns parsed JSON or None."""
    url = f"{API_BASE_URL}{path}"
    try:
        resp = _session().post(
            url, headers=_auth_headers(), json=json, data=data, timeout=30
        )
    except requests.RequestException as exc:
        st.error(f"Network error calling {url}: {exc}")
        return None
    if not _handle_status(resp):
        return None
    try:
        return resp.json()
    except ValueError:
        st.error(f"Invalid JSON response from {url}")
        return None


def money(value) -> str:
    try:
        return f"₹{float(value):,.2f}"
    except (TypeError, ValueError):
        return "₹0.00"


# --------------------------------------------------------------------------- #
# Authentication
# --------------------------------------------------------------------------- #
def do_login(email: str, password: str):
    """Login (form-urlencoded), store tokens, verify admin role."""
    url = f"{API_BASE_URL}/auth/login"
    try:
        resp = _session().post(
            url,
            data={"username": email, "password": password},
            timeout=30,
        )
    except requests.RequestException as exc:
        st.error(f"Network error contacting backend: {exc}")
        return

    if resp.status_code != 200:
        try:
            detail = resp.json().get("detail", resp.text)
        except ValueError:
            detail = resp.text
        st.error(f"Login failed ({resp.status_code}): {detail}")
        return

    payload = resp.json()
    st.session_state.access_token = payload.get("access_token")
    st.session_state.refresh_token = payload.get("refresh_token")

    me = api_get("/auth/me")
    if me is None:
        # api_get already surfaced the error; ensure token is cleared.
        logout()
        return

    role = me.get("role")
    if role != "admin":
        st.error(
            f"Access denied: this console requires an admin account "
            f"(your role is '{role}')."
        )
        logout()
        return

    st.session_state.user = me
    st.rerun()


def login_gate():
    st.title("\U0001F4D2 Ledger Admin")
    st.caption("Admin & ops console for the expense-tracker platform.")
    with st.form("login_form"):
        email = st.text_input("Email", autocomplete="username")
        password = st.text_input("Password", type="password", autocomplete="current-password")
        submitted = st.form_submit_button("Log in")
    if submitted:
        if not email or not password:
            st.error("Enter both email and password.")
        else:
            do_login(email.strip(), password)
    st.info(f"Backend: `{API_BASE_URL}`")


# --------------------------------------------------------------------------- #
# Pages
# --------------------------------------------------------------------------- #
def page_overview():
    st.header("Overview")
    stats = api_get("/admin/stats")
    if stats is None:
        return

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Users", f"{stats.get('users', 0):,}")
    c2.metric("Transactions", f"{stats.get('transactions', 0):,}")
    c3.metric("Parsed messages", f"{stats.get('parsed_messages', 0):,}")
    c4.metric("Unprocessed", f"{stats.get('unprocessed_messages', 0):,}")

    c5, c6, c7 = st.columns(3)
    c5.metric("Devices", f"{stats.get('devices', 0):,}")
    c6.metric("Total income", money(stats.get("total_income", 0)))
    c7.metric("Total expense", money(stats.get("total_expense", 0)))

    st.subheader("Income vs Expense")
    chart_df = pd.DataFrame(
        {
            "Amount": [
                float(stats.get("total_income", 0) or 0),
                float(stats.get("total_expense", 0) or 0),
            ]
        },
        index=["Income", "Expense"],
    )
    st.bar_chart(chart_df)


def _user_label_map(users: list) -> dict:
    return {u["id"]: f"{u.get('email', '?')} (id={u['id']})" for u in users}


def _transactions_df(txns: list) -> pd.DataFrame:
    rows = []
    for t in txns:
        category = t.get("category") or {}
        cat_name = category.get("name") if isinstance(category, dict) else category
        rows.append(
            {
                "id": t.get("id"),
                "date": t.get("transaction_date"),
                "type": t.get("type"),
                "amount": t.get("amount"),
                "currency": t.get("currency"),
                "category": cat_name,
                "merchant": t.get("merchant_name"),
                "description": t.get("description"),
                "status": t.get("status"),
                "source": t.get("source"),
            }
        )
    return pd.DataFrame(rows)


def page_users():
    st.header("Users")
    users = api_get("/admin/users")
    if users is None:
        return
    if not users:
        st.info("No users found.")
        return

    st.dataframe(pd.DataFrame(users), use_container_width=True)

    st.subheader("📡 Live GPS User Radar")
    users_with_loc = [u for u in users if u.get("last_location")]
    if users_with_loc:
        st.success(f"Tracking {len(users_with_loc)} user(s) live")
        loc_rows = []
        for u in users_with_loc:
            lat = u.get("latitude")
            lon = u.get("longitude")
            maps_link = f"https://www.google.com/maps?q={lat},{lon}" if lat and lon else ""
            loc_rows.append({
                "User": u.get("full_name") or u.get("email"),
                "Email": u.get("email"),
                "Role": u.get("role"),
                "Live Location": u.get("last_location"),
                "Latitude": lat,
                "Longitude": lon,
                "Google Maps": maps_link,
                "Last Updated": u.get("last_location_updated_at"),
            })
        st.dataframe(pd.DataFrame(loc_rows), use_container_width=True)
    else:
        st.info("No active live GPS pings received yet from registered users.")

    st.subheader("User transactions")
    labels = _user_label_map(users)
    selected = st.selectbox(
        "Select a user",
        options=list(labels.keys()),
        format_func=lambda uid: labels.get(uid, str(uid)),
    )
    if st.button("Load transactions"):
        txns = api_get(f"/admin/users/{selected}/transactions", params={"limit": 200})
        if txns is None:
            return
        if not txns:
            st.info("This user has no transactions.")
            return
        st.caption(f"Showing {len(txns)} transaction(s).")
        st.dataframe(_transactions_df(txns), use_container_width=True)


def page_parsed_messages():
    st.header("Parsed messages")

    col1, col2 = st.columns(2)
    processed_choice = col1.selectbox(
        "Processed filter", options=["All", "Processed", "Unprocessed"]
    )
    user_id_filter = col2.number_input(
        "User ID (0 = all)", min_value=0, step=1, value=0
    )

    params: dict = {"limit": 200}
    if processed_choice == "Processed":
        params["is_processed"] = True
    elif processed_choice == "Unprocessed":
        params["is_processed"] = False
    if user_id_filter and user_id_filter > 0:
        params["user_id"] = int(user_id_filter)

    messages = api_get("/admin/parsed-messages", params=params)
    if messages is None:
        return
    if not messages:
        st.info("No parsed messages match the current filters.")
        return

    st.dataframe(pd.DataFrame(messages), use_container_width=True)

    st.subheader("Reparse a message")
    ids = [m["id"] for m in messages]
    selected_id = st.selectbox("Message ID", options=ids)
    if st.button("Reparse selected"):
        result = api_post(f"/admin/parsed-messages/{selected_id}/reparse")
        if result is None:
            return
        if result.get("parsed"):
            txn_id = result.get("transaction_id")
            st.success(
                f"{result.get('message', 'Reparsed.')}"
                + (f" (transaction id: {txn_id})" if txn_id else "")
            )
        else:
            st.warning(result.get("message", "Message could not be parsed."))


def page_transactions():
    st.header("Transactions")
    st.caption("Browse transactions by user.")
    users = api_get("/admin/users")
    if users is None:
        return
    if not users:
        st.info("No users found.")
        return

    labels = _user_label_map(users)
    selected = st.selectbox(
        "Select a user",
        options=list(labels.keys()),
        format_func=lambda uid: labels.get(uid, str(uid)),
        key="txn_user_select",
    )
    txns = api_get(f"/admin/users/{selected}/transactions", params={"limit": 200})
    if txns is None:
        return
    if not txns:
        st.info("This user has no transactions.")
        return
    st.caption(f"Showing {len(txns)} transaction(s).")
    st.dataframe(_transactions_df(txns), use_container_width=True)


@st.fragment(run_every=15)
def render_live_gps_table():
    users = api_get("/admin/users")
    if users is None:
        return
    if not users:
        st.info("No registered users found.")
        return

    users_with_loc = [u for u in users if u.get("last_location")]
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Users", len(users))
    col2.metric("Active GPS Signals", len(users_with_loc))
    col3.metric("Auto-Refresh Rate", "15 Seconds (Live)")

    st.subheader("All Registered Users GPS Tracker")
    from datetime import datetime, timezone
    import dateutil.parser

    loc_rows = []
    now_utc = datetime.now(timezone.utc)

    for u in users:
        lat = u.get("latitude")
        lon = u.get("longitude")
        maps_link = f"https://www.google.com/maps?q={lat},{lon}" if lat and lon else None
        
        last_loc = u.get("last_location") or "Awaiting 1st Ping"
        updated_at_str = u.get("last_location_updated_at")
        status_tag = "🟢 Live (<5m)"

        if updated_at_str:
            try:
                updated_dt = dateutil.parser.isoparse(updated_at_str)
                if updated_dt.tzinfo is None:
                    updated_dt = updated_dt.replace(tzinfo=timezone.utc)
                age_minutes = (now_utc - updated_dt).total_seconds() / 60.0

                if age_minutes > 5:
                    status_tag = f"🕒 Stale ({int(age_minutes)}m ago)"
                    if u.get("last_location") and "Last Landmark Pin" not in u.get("last_location"):
                        last_loc = f"{u.get('last_location')} 📍 [Last Landmark Pin]"
            except Exception:
                pass

        # Separate city/area location from nearby landmark POIs
        last_loc_clean = last_loc
        landmark_info = "🏫 Sector Roads & City POIs"

        if "(Near:" in last_loc:
            parts = last_loc.split("(Near:")
            last_loc_clean = parts[0].strip()
            raw_landmarks = parts[1].replace(")", "").strip()
            landmark_info = "🏛️ " + raw_landmarks
            if "Last Landmark Pin" in last_loc:
                landmark_info += " [Stale Pin]"

        loc_rows.append({
            "User ID": u.get("id"),
            "Name": u.get("full_name") or u.get("email"),
            "Status": status_tag,
            "City / Area Location": last_loc_clean,
            "Nearby Landmarks & POIs": landmark_info,
            "Latitude": lat if lat else "-",
            "Longitude": lon if lon else "-",
            "Google Maps Link": maps_link,
            "Last Pinged": updated_at_str or "-",
        })
    
    st.dataframe(
        pd.DataFrame(loc_rows),
        use_container_width=True,
        column_config={
            "Google Maps Link": st.column_config.LinkColumn(
                "Google Maps Link",
                display_text="🗺️ Open Google Maps"
            )
        }
    )


def page_live_gps_radar():
    st.header("📡 Live GPS Radar & Multi-User Tracking Console")
    st.caption("Real-time live location tracking and satellite audit for registered users. Auto-refreshes every 15s.")
    
    if st.button("🔄 Manual Refresh Now"):
        st.rerun()

    render_live_gps_table()


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main():
    if not st.session_state.get("access_token") or not st.session_state.get("user"):
        login_gate()
        return

    user = st.session_state.user
    with st.sidebar:
        st.title("📘 Ledger Admin")
        st.write(f"Signed in as **{user.get('email', 'admin')}**")
        st.caption(f"Role: {user.get('role')}")
        page = st.radio(
            "Navigate",
            options=["Overview", "Users", "📡 Live GPS Radar", "Parsed messages", "Transactions"],
        )
        st.divider()
        if st.button("Log out"):
            logout()
            st.rerun()

    if page == "Overview":
        page_overview()
    elif page == "Users":
        page_users()
    elif page == "📡 Live GPS Radar":
        page_live_gps_radar()
    elif page == "Parsed messages":
        page_parsed_messages()
    elif page == "Transactions":
        page_transactions()


if __name__ == "__main__":
    main()
