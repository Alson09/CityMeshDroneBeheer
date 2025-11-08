from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

app = Flask(__name__)
current_user = {}
CORS(app)

# Supabase credentials
SUPABASE_URL = "https://qhsurldqcywkzehqeavh.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoc3VybGRxY3l3a3plaHFlYXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTIwOTgsImV4cCI6MjA2MDk2ODA5OH0.fGtcmnNdkZk4On2_gda6vPYyS8fNBU6gIQYfgc_4Xm0"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

#default pagina bij het runnen
@app.route("/")
def page():
    return render_template("login.html")

#als login pagina wordt gesubmit dan gaat deze stuk runnen en de juist pagina openen (bij juiste logingegevens)
@app.route("/login", methods=["POST"])
def login():
    global current_user
    email = request.form.get("email")
    password = request.form.get("password")

    result = supabase.table("users").select("*").eq("emailadres", email).single().execute()
    user = result.data

    if user and user["wachtwoord"] == password:
        current_user = user  # <--- STORE USER GLOBALLY
        role = user.get("rol", "")
        if role == "admin":
            return render_template("admin.html")
        elif role == "piloot":
            return render_template("piloot.html")
        elif role == "mechanieker":
            return render_template("mechanic.html")
        else:
            return "Onbekende rol", 403
    else:
        return "Foutieve login", 401


#je kan gewoon /admin oproepen en verwijst standaard naar admin.html
@app.route("/admin")
def admin():
    return render_template("admin.html")

#je kan gewoon /piloot oproepen en verwijst standaard naar piloot.html
@app.route("/piloot")
def piloot():
    return render_template("piloot.html")

#je kan gewoon /mechanieker oproepen en verwijst standaard naar mechanieker.html
@app.route("/mechanieker")
def mechanic():
    return render_template("mechanic.html")

# Serve static files (css/js)
@app.route('/css/<path:filename>')
def serve_css(filename):
    return app.send_static_file(f"css/{filename}")

@app.route('/js/<path:filename>')
def serve_js(filename):
    return app.send_static_file(f"js/{filename}")



# dit is de GET voor de stations en drones die behoren tot zijn station
@app.route("/api/stations", methods=["GET"])
def get_stations_with_drones():
    stations_response = supabase.table("stations").select("*").execute()
    drones_response = supabase.table("drones").select("*").execute()

    stations = stations_response.data or []
    drones = drones_response.data or []

    # Koppel drones aan stations
    for station in stations:
        station_id = station["id"]
        station["drones"] = [d for d in drones if d["station_id"] == station_id]

    return jsonify(stations)




#dit is het versturen van een notificatie
@app.route("/api/reserveer", methods=["POST"])
def reserveer_drone():
    global current_user
    data = request.json
    drone_id = data.get("drone_id")

    # Get gebruiker_id from global user
    gebruiker_id = current_user.get("id")

    supabase.table("reservaties").insert({
        "drone_id": drone_id,
        "gebruiker_id": gebruiker_id,  # <-- LINK PILOOT TO RESERVATIE
    }).execute()

    # drone_info = supabase.table("drones").select("*").eq("id", drone_id).single().execute().data
    # station_id = drone_info.get("station_id")
    # station_info = supabase.table("stations").select("*").eq("id", station_id).single().execute().data
    #
    # boodschap = f"Nieuwe reserveringsaanvraag voor drone {drone_info['naam']} in {station_info['naam']}"
    # supabase.table("notificaties").insert({
    #     "gebruiker_id": gebruiker_id,
    #     "boodschap": boodschap
    # }).execute()

    return jsonify({"message": "Reservering verstuurd"})




# Ophalen van alle reserveringen
@app.route("/api/reservaties", methods=["GET"])
def get_all_reservaties():
    result = supabase.table("reservaties").select("*").execute()
    reservaties = result.data or []

    for r in reservaties:
        drone = supabase.table("drones").select("naam, station_id").eq("id", r["drone_id"]).single().execute().data
        if drone:
            r["drone_naam"] = drone["naam"]
            station = supabase.table("stations").select("naam").eq("id", drone["station_id"]).single().execute().data
            r["station_naam"] = station["naam"] if station else "Onbekend"
        else:
            r["drone_naam"] = "Onbekend"
            r["station_naam"] = "Onbekend"

    return jsonify(reservaties)




# Goedkeuren/Weigeren van een reservering
@app.route("/api/reservaties/<int:res_id>", methods=["PUT"])
def update_reservering(res_id):
    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["pending", "accepted", "rejected"]:
        return jsonify({"error": "Ongeldige status"}), 400

    # Update de reserveringsstatus
    supabase.table("reservaties").update({"status": new_status}).eq("id", res_id).execute()

    # Haal reservatie info op
    reservation = supabase.table("reservaties").select("*").eq("id", res_id).single().execute().data
    drone = supabase.table("drones").select("*").eq("id", reservation["drone_id"]).single().execute().data
    pilot_id = reservation.get("gebruiker_id")
    drone_naam = drone.get("naam", "onbekend")

    # Stel boodschap op
    if new_status == "accepted":
        boodschap = f"Uw reservering voor drone {drone_naam} is geaccepteerd."
    else:
        boodschap = f"Uw reservering voor drone {drone_naam} is geweigerd."

    # Stuur notificatie naar piloot
    if pilot_id:
        supabase.table("notificaties").insert({
            "gebruiker_id": pilot_id,
            "boodschap": boodschap
        }).execute()

    return jsonify({"message": f"Reservering {new_status}"}), 200



@app.route("/api/notifications/piloot", methods=["GET"])
def get_notifications_for_pilot():
    global current_user
    gebruiker_id = current_user.get("id")

    # Haal enkel notificaties waarbij 'Gelezen' false is
    result = supabase.table("notificaties").select("*").eq("gebruiker_id", gebruiker_id).eq("gelezen", False).execute()
    notifications = result.data or []

    return jsonify(notifications)




@app.route("/api/notificaties/<int:notification_id>/read", methods=["PUT"])
def mark_notification_as_read(notification_id):
    # Update the notification's 'gelezen' field to True
    result = supabase.table("notificaties").update({"gelezen": True}).eq("id", notification_id).execute()

    if result.status_code == 200:
        return jsonify({"message": "Notification marked as read"}), 200
    else:
        return jsonify({"error": "Failed to mark notification as read"}), 400



# POST: Verslag indienen (alleen voor mechaniekers)
@app.route("/api/verslagen", methods=["POST"])
def create_verslag():
    global current_user
    gebruiker_id = current_user.get("id")

    data = request.json
    titel = data.get("titel")
    inhoud = data.get("inhoud")

    if not titel or not inhoud:
        return jsonify({"error": "Titel en inhoud zijn verplicht"}), 400

    response = supabase.table("verslagen").insert({
        "gebruiker_id": gebruiker_id,
        "titel": titel,
        "inhoud": inhoud
    }).execute()

    if response.get("error"):
        return jsonify({"error": "Fout bij het opslaan van het verslag"}), 500

    return jsonify({"message": "Verslag succesvol ingediend"}), 201


# GET: Alle verslagen ophalen (bijvoorbeeld om te tonen)
@app.route("/api/verslagen", methods=["GET"])
def get_verslagen():
    result = supabase.table("verslagen").select("*").execute()
    verslagen = result.data or []
    return jsonify(verslagen)



if __name__ == "__main__":
    app.run(debug=True)