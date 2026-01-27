/**
 * TrainingLanding.js - Page publique pour le secteur Formation
 * Affiche les cours disponibles et permet l'inscription
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  BookOpenIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const TrainingLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollSession, setEnrollSession] = useState(null);
  const [enrollForm, setEnrollForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch tenant info
        const tenantRes = await api.get(`/public/tenant/${slug}`);
        if (tenantRes.data.success) {
          setTenant(tenantRes.data.data);
        }

        // Fetch courses
        const coursesRes = await api.get(`/public/training/${slug}/courses`);
        if (coursesRes.data.success) {
          setCourses(coursesRes.data.data || []);
        }

        // Fetch upcoming sessions
        const sessionsRes = await api.get(`/public/training/${slug}/sessions`);
        if (sessionsRes.data.success) {
          setSessions(sessionsRes.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: tenant?.currency || "EUR",
    }).format(amount);
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!enrollSession) return;

    try {
      setEnrolling(true);
      await api.post(`/public/training/${slug}/enroll`, {
        session_id: enrollSession.id,
        ...enrollForm,
      });
      setEnrollSuccess(true);
    } catch (error) {
      console.error("Error enrolling:", error);
      alert(error.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setEnrolling(false);
    }
  };

  const getSessionsForCourse = (courseId) => {
    return sessions.filter((s) => s.course_id === courseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <AcademicCapIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Centre de formation introuvable</h2>
          <p className="text-slate-500">Vérifiez l'URL et réessayez</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative">
        {tenant.banner_url ? (
          <div className="h-64 md:h-80 overflow-hidden">
            <img
              src={tenant.banner_url}
              alt={tenant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-80 bg-gradient-to-r from-indigo-600 to-purple-700" />
        )}

        {/* Tenant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <div className="max-w-6xl mx-auto flex items-end gap-6">
            {tenant.logo_url && (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{tenant.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm md:text-base opacity-90">
                {tenant.address && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {tenant.address}, {tenant.city}
                  </span>
                )}
                {tenant.phone && (
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="h-4 w-4" />
                    {tenant.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-indigo-100">
            <BookOpenIcon className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{courses.length}</div>
            <div className="text-sm text-slate-500">Formations</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-purple-100">
            <CalendarDaysIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{sessions.length}</div>
            <div className="text-sm text-slate-500">Sessions à venir</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-pink-100">
            <UserGroupIcon className="h-8 w-8 text-pink-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">
              {sessions.reduce((acc, s) => acc + (s.available_spots || 0), 0)}
            </div>
            <div className="text-sm text-slate-500">Places disponibles</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-emerald-100">
            <AcademicCapIcon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">100%</div>
            <div className="text-sm text-slate-500">Certifié</div>
          </div>
        </div>

        {/* Courses List */}
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BookOpenIcon className="h-7 w-7 text-indigo-500" />
          Nos Formations
        </h2>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-200">
            <BookOpenIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucune formation disponible</h3>
            <p className="text-slate-500">De nouvelles formations seront bientôt disponibles</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const courseSessions = getSessionsForCourse(course.id);
              const nextSession = courseSessions[0];

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group"
                >
                  {/* Course Image */}
                  {course.image_url ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={course.image_url}
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <AcademicCapIcon className="h-16 w-16 text-indigo-300" />
                    </div>
                  )}

                  <div className="p-5">
                    {/* Category badge */}
                    {course.category && (
                      <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full mb-3">
                        {course.category}
                      </span>
                    )}

                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{course.name}</h3>

                    {course.description && (
                      <p className="text-slate-500 text-sm mb-4 line-clamp-2">{course.description}</p>
                    )}

                    {/* Course details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ClockIcon className="h-4 w-4 text-slate-400" />
                        <span>{course.duration_hours || 0}h de formation</span>
                      </div>
                      {course.level && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircleIcon className="h-4 w-4 text-slate-400" />
                          <span>Niveau: {course.level}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CurrencyEuroIcon className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-indigo-600">{formatCurrency(course.price || 0)}</span>
                      </div>
                    </div>

                    {/* Next session */}
                    {nextSession && (
                      <div className="p-3 bg-indigo-50 rounded-xl mb-4">
                        <div className="text-xs text-indigo-600 font-medium mb-1">Prochaine session</div>
                        <div className="text-sm font-medium text-slate-800">
                          {formatDate(nextSession.session_date)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {nextSession.available_spots} place{nextSession.available_spots > 1 ? 's' : ''} restante{nextSession.available_spots > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        if (nextSession) {
                          setEnrollSession(nextSession);
                          setShowEnrollModal(true);
                        }
                      }}
                      disabled={!nextSession}
                      className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                        nextSession
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {nextSession ? (
                        <>
                          S'inscrire
                          <ArrowRightIcon className="h-4 w-4" />
                        </>
                      ) : (
                        "Aucune session disponible"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Contactez-nous</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <PhoneIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Téléphone</div>
                  <div className="font-medium text-slate-800">{tenant.phone}</div>
                </div>
              </a>
            )}
            {tenant.email && (
              <a
                href={`mailto:${tenant.email}`}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <EnvelopeIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Email</div>
                  <div className="font-medium text-slate-800">{tenant.email}</div>
                </div>
              </a>
            )}
            {tenant.address && (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <MapPinIcon className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Adresse</div>
                  <div className="font-medium text-slate-800">
                    {tenant.address}, {tenant.postal_code} {tenant.city}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && enrollSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {enrollSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Inscription confirmée !</h3>
                <p className="text-slate-500 mb-6">
                  Vous recevrez un email de confirmation avec tous les détails de votre formation.
                </p>
                <button
                  onClick={() => {
                    setShowEnrollModal(false);
                    setEnrollSuccess(false);
                    setEnrollForm({ name: "", email: "", phone: "", notes: "" });
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-800">S'inscrire à la formation</h2>
                  <p className="text-slate-500 text-sm mt-1">{selectedCourse?.name}</p>
                </div>

                {/* Session info */}
                <div className="p-4 m-4 bg-indigo-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CalendarDaysIcon className="h-10 w-10 text-indigo-500" />
                    <div>
                      <div className="font-medium text-slate-800">
                        {formatDate(enrollSession.session_date)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatTime(enrollSession.start_time)} - {formatTime(enrollSession.end_time)}
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleEnroll} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollForm.name}
                      onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Jean Dupont"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={enrollForm.email}
                      onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="jean@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={enrollForm.phone}
                      onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={enrollForm.notes}
                      onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Questions ou remarques..."
                    />
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-600">Prix de la formation</span>
                    <span className="text-xl font-bold text-indigo-600">
                      {formatCurrency(selectedCourse?.price || 0)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEnrollModal(false);
                        setEnrollForm({ name: "", email: "", phone: "", notes: "" });
                      }}
                      className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={enrolling}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {enrolling ? "Inscription..." : "Confirmer"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingLanding;
