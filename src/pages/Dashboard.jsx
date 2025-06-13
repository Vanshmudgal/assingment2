// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth';
import { db } from '../services/firebase';
import { 
  collection, query, where, getDocs, addDoc,
  doc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const user = getCurrentUser();
  const [bugs, setBugs] = useState([]);
  const [filteredBugs, setFilteredBugs] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [projects] = useState(['Project A', 'Project B', 'Project C']);
  const [teamMembers] = useState(['Alice', 'Bob', 'Charlie', 'Diana']);
  const [newBug, setNewBug] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    project: '',
    assignee: '',
    dueDate: '',
    createdBy: user.name,
    labels: []
  });
  const [editingBug, setEditingBug] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    project: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  useEffect(() => {
    fetchBugs();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
    generateTrendData();
  }, [bugs, filters, sortConfig]);

  const fetchBugs = async () => {
    const q = query(collection(db, 'bugs'));
    const querySnapshot = await getDocs(q);
    const bugsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setBugs(bugsData);
  };

  const generateTrendData = () => {
    const dailyData = {};
    
    bugs.forEach(bug => {
      const date = bug.createdAt?.toDate 
        ? bug.createdAt.toDate().toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          open: 0,
          'in-progress': 0,
          'pending-approval': 0,
          closed: 0
        };
      }
      
      if (bug.status in dailyData[date]) {
        dailyData[date][bug.status]++;
      }
    });

    const trendData = Object.values(dailyData).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    setTrendData(trendData);
  };

  const applyFiltersAndSort = () => {
    let result = [...bugs];
    
    if (filters.status) {
      result = result.filter(bug => bug.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter(bug => bug.priority === filters.priority);
    }
    if (filters.project) {
      result = result.filter(bug => bug.project === filters.project);
    }
    
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredBugs(result);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddBug = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'bugs'), {
        ...newBug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewBug({
        title: '',
        description: '',
        status: 'open',
        priority: 'medium',
        project: '',
        assignee: '',
        dueDate: '',
        createdBy: user.name,
        labels: []
      });
    } catch (error) {
      console.error('Error adding bug: ', error);
    }
  };

  const handleUpdateBug = async () => {
    try {
      await updateDoc(doc(db, 'bugs', editingBug.id), {
        ...editingBug,
        updatedAt: serverTimestamp()
      });
      setEditingBug(null);
    } catch (error) {
      console.error('Error updating bug: ', error);
    }
  };

  const handleDeleteBug = async (bugId) => {
    try {
      await deleteDoc(doc(db, 'bugs', bugId));
    } catch (error) {
      console.error('Error deleting bug: ', error);
    }
  };

  const handleCloseBug = async (bugId) => {
    try {
      await updateDoc(doc(db, 'bugs', bugId), {
        status: 'pending-approval',
        closedBy: user.name,
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error closing bug: ', error);
    }
  };

  const handleApproveBug = async (bugId) => {
    try {
      await updateDoc(doc(db, 'bugs', bugId), {
        status: 'closed',
        approvedBy: user.name,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error approving bug: ', error);
    }
  };

  const handleReopenBug = async (bugId) => {
    try {
      await updateDoc(doc(db, 'bugs', bugId), {
        status: 'open',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error reopening bug: ', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBug(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLabelToggle = (label) => {
    setNewBug(prev => {
      const newLabels = prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label];
      return { ...prev, labels: newLabels };
    });
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'open': return { backgroundColor: '#fff6f6' };
      case 'in-progress': return { backgroundColor: '#fffaf0' };
      case 'pending-approval': return { backgroundColor: '#fff0f5' };
      case 'closed': return { backgroundColor: '#f8f8f8', color: '#888' };
      default: return {};
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    section: {
      marginTop: '20px',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    filterSection: {
      margin: '20px 0',
      padding: '15px',
      backgroundColor: '#e9f5ff',
      borderRadius: '8px'
    },
    filterRow: {
      display: 'flex',
      gap: '15px',
      marginTop: '10px'
    },
    filterSelect: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd'
    },
    bugForm: {
      marginBottom: '30px',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    formRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      marginBottom: '15px'
    },
    formGroup: {
      flex: '1',
      minWidth: '200px'
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '14px'
    },
    textarea: {
      width: '100%',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '14px',
      resize: 'vertical'
    },
    select: {
      width: '100%',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    labelContainer: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    labelButton: {
      padding: '6px 12px',
      borderRadius: '16px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px'
    },
    submitButton: {
      padding: '10px 20px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      marginTop: '10px'
    },
    bugList: {
      marginTop: '20px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    tableTh: {
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '12px',
      textAlign: 'left',
      cursor: 'pointer'
    },
    tableTd: {
      padding: '12px',
      borderBottom: '1px solid #ddd'
    },
    statsContainer: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px'
    },
    statCard: {
      flex: '1',
      backgroundColor: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '10px 0 0',
      color: '#333'
    },
    chartContainer: {
      margin: '20px 0',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    actionButton: {
      padding: '5px 10px',
      margin: '0 5px',
      backgroundColor: '#33b5e5',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      width: '80%',
      maxWidth: '600px'
    }
  };

  return (
    <div style={styles.container}>
      <h2>Welcome, {user.name}!</h2>
      <p>You are logged in as a {user.role}.</p>
      
      <div style={styles.filterSection}>
        <h3>Filters</h3>
        <div style={styles.filterRow}>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            style={styles.filterSelect}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="pending-approval">Pending Approval</option>
            <option value="closed">Closed</option>
          </select>
          
          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            style={styles.filterSelect}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          
          <select
            name="project"
            value={filters.project}
            onChange={handleFilterChange}
            style={styles.filterSelect}
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
        </div>
      </div>

      {user.role === 'developer' && (
        <div style={styles.section}>
          <h3>Developer Tools</h3>
          
          <div style={styles.bugForm}>
            <h4>Create New Bug/Task</h4>
            <form onSubmit={handleAddBug}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Title*</label>
                  <input
                    type="text"
                    name="title"
                    value={newBug.title}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>Project*</label>
                  <select
                    name="project"
                    value={newBug.project}
                    onChange={handleInputChange}
                    required
                    style={styles.select}
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project} value={project}>{project}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Description*</label>
                  <textarea
                    name="description"
                    value={newBug.description}
                    onChange={handleInputChange}
                    required
                    style={styles.textarea}
                    rows="4"
                  />
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Priority*</label>
                  <select
                    name="priority"
                    value={newBug.priority}
                    onChange={handleInputChange}
                    required
                    style={styles.select}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label>Status*</label>
                  <select
                    name="status"
                    value={newBug.status}
                    onChange={handleInputChange}
                    required
                    style={styles.select}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label>Assignee</label>
                  <select
                    name="assignee"
                    value={newBug.assignee}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newBug.dueDate}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Labels</label>
                  <div style={styles.labelContainer}>
                    {['bug', 'feature', 'ui', 'backend', 'urgent'].map(label => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleLabelToggle(label)}
                        style={{
                          ...styles.labelButton,
                          backgroundColor: newBug.labels.includes(label) ? '#4CAF50' : '#e0e0e0',
                          color: newBug.labels.includes(label) ? 'white' : 'black'
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <button type="submit" style={styles.submitButton}>Create Bug</button>
            </form>
          </div>
          
          <div style={styles.bugList}>
            <h4>Your Bugs</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('title')}>Title</th>
                  <th onClick={() => handleSort('project')}>Project</th>
                  <th onClick={() => handleSort('status')}>Status</th>
                  <th onClick={() => handleSort('priority')}>Priority</th>
                  <th>Assignee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs
                  .filter(bug => bug.createdBy === user.name || bug.assignee === user.name)
                  .map(bug => (
                    <tr key={bug.id} style={getStatusStyle(bug.status)}>
                      <td>{bug.title}</td>
                      <td>{bug.project}</td>
                      <td>{bug.status}</td>
                      <td>{bug.priority}</td>
                      <td>{bug.assignee || 'Unassigned'}</td>
                      <td>
                        <button 
                          onClick={() => setEditingBug(bug)}
                          style={styles.actionButton}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteBug(bug.id)}
                          style={{...styles.actionButton, backgroundColor: '#ff4444'}}
                        >
                          Delete
                        </button>
                        {(bug.status === 'open' || bug.status === 'in-progress') && (
                          <button 
                            onClick={() => handleCloseBug(bug.id)}
                            style={{...styles.actionButton, backgroundColor: '#ffbb33'}}
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {editingBug && (
            <div style={styles.modal}>
              <div style={styles.modalContent}>
                <h3>Edit Bug</h3>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label>Title*</label>
                    <input
                      type="text"
                      name="title"
                      value={editingBug.title}
                      onChange={(e) => setEditingBug({...editingBug, title: e.target.value})}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Project*</label>
                    <select
                      name="project"
                      value={editingBug.project}
                      onChange={(e) => setEditingBug({...editingBug, project: e.target.value})}
                      required
                      style={styles.select}
                    >
                      <option value="">Select Project</option>
                      {projects.map(project => (
                        <option key={project} value={project}>{project}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label>Description*</label>
                    <textarea
                      name="description"
                      value={editingBug.description}
                      onChange={(e) => setEditingBug({...editingBug, description: e.target.value})}
                      required
                      style={styles.textarea}
                      rows="4"
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label>Priority*</label>
                    <select
                      name="priority"
                      value={editingBug.priority}
                      onChange={(e) => setEditingBug({...editingBug, priority: e.target.value})}
                      required
                      style={styles.select}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Status*</label>
                    <select
                      name="status"
                      value={editingBug.status}
                      onChange={(e) => setEditingBug({...editingBug, status: e.target.value})}
                      required
                      style={styles.select}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      {editingBug.status === 'pending-approval' && (
                        <option value="pending-approval">Pending Approval</option>
                      )}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleUpdateBug}
                  style={{...styles.submitButton, marginRight: '10px'}}
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setEditingBug(null)}
                  style={{...styles.submitButton, backgroundColor: '#ff4444'}}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {user.role === 'manager' && (
        <div style={styles.section}>
          <h3>Management Dashboard</h3>
          
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <h4>Open Bugs</h4>
              <p style={styles.statNumber}>{bugs.filter(b => b.status === 'open').length}</p>
            </div>
            <div style={styles.statCard}>
              <h4>In Progress</h4>
              <p style={styles.statNumber}>{bugs.filter(b => b.status === 'in-progress').length}</p>
            </div>
            <div style={styles.statCard}>
              <h4>Pending Approval</h4>
              <p style={styles.statNumber}>{bugs.filter(b => b.status === 'pending-approval').length}</p>
            </div>
            <div style={styles.statCard}>
              <h4>Closed</h4>
              <p style={styles.statNumber}>{bugs.filter(b => b.status === 'closed').length}</p>
            </div>
          </div>
          
          <div style={styles.chartContainer}>
            <h4>Bug Trends</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="open" stroke="#8884d8" name="Open" />
                <Line type="monotone" dataKey="in-progress" stroke="#ffc658" name="In Progress" />
                <Line type="monotone" dataKey="pending-approval" stroke="#ff8042" name="Pending Approval" />
                <Line type="monotone" dataKey="closed" stroke="#82ca9d" name="Closed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div style={styles.bugList}>
            <h4>All Bugs</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs.map(bug => (
                  <tr key={bug.id} style={getStatusStyle(bug.status)}>
                    <td>{bug.title}</td>
                    <td>{bug.project}</td>
                    <td>{bug.status}</td>
                    <td>{bug.priority}</td>
                    <td>{bug.assignee || 'Unassigned'}</td>
                    <td>{bug.createdBy}</td>
                    <td>
                      {bug.status === 'pending-approval' && (
                        <>
                          <button 
                            onClick={() => handleApproveBug(bug.id)}
                            style={{...styles.actionButton, backgroundColor: '#00C851'}}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReopenBug(bug.id)}
                            style={{...styles.actionButton, backgroundColor: '#ffbb33'}}
                          >
                            Reopen
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;